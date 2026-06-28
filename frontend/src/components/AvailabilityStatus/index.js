import React from "react";
import Chip from "@material-ui/core/Chip";
import { i18n } from "../../translate/i18n";

export const availabilityStatusOptions = [
  "available",
  "busy",
  "away",
  "unavailable",
];

const colors = {
  available: "#63B246",
  busy: "#D99B35",
  away: "#8C9AA8",
  unavailable: "#D9534F",
  offline: "#6B7280",
};

export const availabilityStatusLabel = (status) =>
  i18n.t(`users.availability.statuses.${status || "offline"}`);

export const AvailabilityChip = ({ status }) => {
  const normalized = status || "offline";
  const color = colors[normalized] || colors.offline;
  return (
    <Chip
      size="small"
      variant="outlined"
      label={availabilityStatusLabel(normalized)}
      style={{ color, borderColor: color }}
    />
  );
};
