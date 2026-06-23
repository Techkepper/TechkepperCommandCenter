export const normalizeContactNumber = (value = ""): string =>
  value.split("@")[0].replace(/\D/g, "");

export const getContactNumberVariants = (value = ""): string[] => {
  const normalized = normalizeContactNumber(value);
  const variants = new Set<string>();

  if (!normalized) {
    return [];
  }

  variants.add(normalized);

  if (normalized.startsWith("506") && normalized.length === 11) {
    variants.add(normalized.slice(3));
  }

  if (normalized.length === 8) {
    variants.add(`506${normalized}`);
  }

  if (normalized.length > 8) {
    variants.add(normalized.slice(-8));
  }

  return Array.from(variants);
};

export const isGenericContactName = (
  currentName = "",
  numberVariants: string[] = []
): boolean => {
  const normalizedName = normalizeContactNumber(currentName);
  const trimmedName = currentName.trim();

  return (
    !trimmedName ||
    numberVariants.includes(trimmedName) ||
    (normalizedName.length > 0 && numberVariants.includes(normalizedName))
  );
};
