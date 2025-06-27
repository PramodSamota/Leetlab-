function parseNumber(valueWithUnit) {
  if (!valueWithUnit) return null;
  const num = parseFloat(valueWithUnit.replace(/[^\d.]/g, ""));
  return isNaN(num) ? null : num;
}

export function getAverage(values) {
  const nums = values.map(parseNumber).filter((n) => n !== null);
  if (!nums.length) return null;
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  return avg.toFixed(3); // 3 decimal places
}
