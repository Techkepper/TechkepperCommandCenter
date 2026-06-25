import AppError from "../../errors/AppError";

export const normalizeOptionalDocumentId = (
  value: unknown,
  label: string
): number | null => {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    value === 0 ||
    value === "0"
  ) {
    return null;
  }

  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized <= 0) {
    throw new AppError(`${label} no es válido.`, 400);
  }

  return normalized;
};
