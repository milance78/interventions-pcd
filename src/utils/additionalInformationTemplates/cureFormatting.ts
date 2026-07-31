import type { CureRecord } from "../../redux/features/newInterventionSlice";

export const formatCureDate = (record: CureRecord | null): string => {
  if (!record?.date) return "—";
  const [year, month, day] = record.date.split("-");
  return year && month && day ? `${day}/${month}/${year}` : record.date;
};

export const formatCureTime = (record: CureRecord | null): string =>
  record?.time?.trim() || "—";
