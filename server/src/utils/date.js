export const differenceInYears = (dateLeft, dateRight) => {
  const diff = dateLeft.getFullYear() - dateRight.getFullYear();
  const adjust = dateLeft.getMonth() < dateRight.getMonth()
    || (dateLeft.getMonth() === dateRight.getMonth() && dateLeft.getDate() < dateRight.getDate())
    ? 1
    : 0;
  return diff - adjust;
};

export const parseISO = (value) => {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};
