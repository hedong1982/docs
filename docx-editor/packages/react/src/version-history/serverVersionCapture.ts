// Purpose: Persist only acknowledged server revisions in local version history.
// Structure: Freeze JSON before serialization, deduplicate, and throttle automatic checkpoints.
import type { VersionDraft } from './store';

export function createServerVersionCapture(options: {
  initialData: unknown;
  write: (draft: VersionDraft) => Promise<number>;
  now?: () => number;
  intervalMs?: number;
}) {
  const now = options.now ?? Date.now;
  let capturedData = JSON.stringify(options.initialData);
  let lastCaptureAt: number | null = null;
  let queue: Promise<unknown> = Promise.resolve();
  return {
    prepare(draft: Omit<VersionDraft, 'savedAt' | 'kind'>) {
      // ProseMirror attributes can contain shared objects: keep an isolated copy
      // of exactly the revision about to be serialized, not the eventual live view.
      const serialized = JSON.stringify(draft.data);
      const frozenDraft = { ...draft, data: JSON.parse(serialized) };
      return (manual: boolean): Promise<number | null> => {
        const capture = async () => {
          if (serialized === capturedData) return null;
          const savedAt = now();
          if (!manual && lastCaptureAt !== null &&
              savedAt - lastCaptureAt < (options.intervalMs ?? 10 * 60 * 1000)) return null;
          try {
            // Save checkpoints retain the existing bounded automatic retention;
            // only user-named versions have permanent manual retention.
            const id = await options.write({ ...frozenDraft, kind: 'auto', savedAt });
            capturedData = serialized;
            lastCaptureAt = savedAt;
            return id;
          } catch (error) {
            // A local history failure must never turn a successful server write
            // into a failed save or suppress a later checkpoint retry.
            console.warn('[version-history] server checkpoint failed', error);
            return null;
          }
        };
        const result = queue.then(capture);
        queue = result;
        return result;
      };
    },
  };
}
