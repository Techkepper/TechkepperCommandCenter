import SmartDocument from "../../models/SmartDocument";
import { getDocumentStorageAvailability } from "./documentStorageAvailability";

export const serializeSmartDocument = async (
  document: SmartDocument
): Promise<Record<string, unknown>> => ({
  ...(typeof document.toJSON === "function" ? document.toJSON() : document),
  ...(await getDocumentStorageAvailability(document))
});

export const serializeSmartDocuments = (
  documents: SmartDocument[]
): Promise<Record<string, unknown>[]> =>
  Promise.all(documents.map(serializeSmartDocument));
