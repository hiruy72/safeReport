import crypto from "crypto";

export function generateAnonymousId(): string {
  const num = crypto.randomInt(100000, 999999);
  return `VCT-${num}`;
}

export function generateCaseNumber(): string {
  const num = crypto.randomInt(100, 999);
  const suffix = crypto.randomInt(1000, 9999);
  return `SH-${num}${suffix}`;
}

export function ageRangeFromDob(dateOfBirth: Date): string {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  const lower = Math.floor(age / 5) * 5;
  const upper = lower + 5;
  return `${lower}-${upper}`;
}
