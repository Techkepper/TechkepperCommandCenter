import fs from "fs";

import SmartDocument from "../../models/SmartDocument";
import { resolveDocumentPath } from "./documentStorage";

export type DocumentStorageLocation =
  | "local_only"
  | "cloud_only"
  | "local_and_cloud"
  | "unavailable";

export type DocumentStorageAvailability = {
  hasLocalCopy: boolean;
  hasCloudCopy: boolean;
  storageLocation: DocumentStorageLocation;
};

type AvailabilitySource = Pick<
  SmartDocument,
  | "storagePath"
  | "storageProvider"
  | "storageStatus"
  | "storageFileId"
  | "externalStoragePath"
>;

export const hasLocalDocumentFile = async (
  storagePath: string | null | undefined
): Promise<boolean> => {
  if (!storagePath) return false;
  try {
    await fs.promises.access(
      resolveDocumentPath(storagePath),
      fs.constants.F_OK
    );
    return true;
  } catch {
    return false;
  }
};

export const hasCloudDocumentCopy = (document: AvailabilitySource): boolean =>
  document.storageProvider === "dropbox" &&
  document.storageStatus === "synced" &&
  Boolean(document.storageFileId || document.externalStoragePath);

export const getDocumentStorageAvailability = async (
  document: AvailabilitySource
): Promise<DocumentStorageAvailability> => {
  const hasLocalCopy = await hasLocalDocumentFile(document.storagePath);
  const hasCloudCopy = hasCloudDocumentCopy(document);

  let storageLocation: DocumentStorageLocation;
  if (hasLocalCopy && hasCloudCopy) {
    storageLocation = "local_and_cloud";
  } else if (hasLocalCopy) {
    storageLocation = "local_only";
  } else if (hasCloudCopy) {
    storageLocation = "cloud_only";
  } else {
    storageLocation = "unavailable";
  }

  return { hasLocalCopy, hasCloudCopy, storageLocation };
};
