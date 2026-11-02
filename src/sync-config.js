// Where synced progress is kept: a free Google Firebase (Firestore) project.
// Fill in the Project ID from Firebase console > Project settings > General
// (see docs/sync-setup.md). An apiKey is optional. Neither is secret; the
// Firestore rules in that guide are what protect the data. While this is
// null, the game hides the Sync controls and only offers backup files.
//
// Example: export const SYNC_CONFIG = { projectId: 'med-prep-sync' };
export const SYNC_CONFIG = null;
