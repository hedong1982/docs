// Purpose: Track edits acknowledged by the server independently of local downloads.
// Structure: A save captures a revision; only its successful response acknowledges it.
export function createServerSaveTracker(onChange: (dirty: boolean) => void) {
  let revision = 0;
  let savedRevision = 0;
  return {
    changed() {
      revision += 1;
      onChange(revision !== savedRevision);
    },
    capture() {
      return revision;
    },
    saved(snapshot: number) {
      savedRevision = Math.max(savedRevision, snapshot);
      onChange(revision !== savedRevision);
    },
    isDirty() {
      return revision !== savedRevision;
    },
  };
}
