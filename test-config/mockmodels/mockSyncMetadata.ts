import { SyncMetadata } from '../../src/shared/interfaces/sync-metadata';

export const mockSyncMetadata = (method: string, docId: string, docType: string) => {
  const mock: SyncMetadata = {
    method: method,
    docId: docId,
    docType: docType
  };

  return mock;
};
