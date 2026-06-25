import CollaboratorDocument from "../../models/CollaboratorDocument";
import { recordDocumentEvent } from "./DocumentLifecycleService";

export const setDocumentCollaborator = async ({
  documentId,
  collaboratorId,
  userId
}: {
  documentId: number;
  collaboratorId: number;
  userId: string;
}): Promise<void> => {
  await CollaboratorDocument.upsert({
    documentId,
    collaboratorId,
    linkedById: Number(userId)
  } as unknown as CollaboratorDocument);
  await recordDocumentEvent({
    documentId,
    userId,
    eventType: "associated_collaborator",
    metadata: { collaboratorId }
  });
};
