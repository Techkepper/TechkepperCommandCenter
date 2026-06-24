import CollaboratorDocument from "../../models/CollaboratorDocument";

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
};
