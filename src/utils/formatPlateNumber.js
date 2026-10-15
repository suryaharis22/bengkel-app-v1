export function formatPlateNumber(region = "", number = "", suffix = "") {
  const clean = (value) => value.toUpperCase().replace(/[^A-Z0-9]/g, "");

  return [region, number, suffix].map(clean).filter(Boolean).join("-");
}

export function ViewPlateNumber(plateNumber = "") {
  return plateNumber.replace(/-/g, " ").toUpperCase();
}
