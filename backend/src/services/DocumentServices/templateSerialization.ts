import SmartDocumentTemplateVersion from "../../models/SmartDocumentTemplateVersion";

export const parseJsonList = (value?: string | null): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(item => String(item)) : [];
  } catch {
    return [];
  }
};

export const serializeJsonList = (value: string[]): string =>
  JSON.stringify(
    value
      .map(item => item.trim())
      .filter(Boolean)
      .filter((item, index, all) => all.indexOf(item) === index)
      .sort()
  );

export const serializeTemplateVersion = (
  version: SmartDocumentTemplateVersion
): Record<string, unknown> => ({
  ...version.toJSON(),
  detectedVariables: parseJsonList(version.detectedVariables),
  requiredVariables: parseJsonList(version.requiredVariables)
});
