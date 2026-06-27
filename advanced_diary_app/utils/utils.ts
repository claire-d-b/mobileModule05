export const formatDate = (timestamp: string) => {
  return new Date(timestamp).toLocaleDateString("en-CA"); // "2026-05-01"
};

export const formatDateEN = (date: Date): string => {
  return date.toLocaleDateString("en-CA", {
    day: "numeric",
    month: "2-digit",
    year: "numeric",
  });
};
