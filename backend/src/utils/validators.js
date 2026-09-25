export function required(value, field) {
  if (!value) throw new Error(`${field} is required`);
  return value;
}
