export const defaultLaneAccent = '#5c8df6';
export const defaultLaneSecondary = '#63cfe0';

const safeHexColor = /^#(?:[\da-f]{3}|[\da-f]{6})$/i;

export function validatedLaneColor(value: string | undefined, fallback: string) {
  return value && safeHexColor.test(value) ? value : fallback;
}
