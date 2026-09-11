/**
 * Generates a random user code (e.g., 'A1125').
 * Pattern: One uppercase letter followed by 4 random digits.
 */
export const generateUserCode = (): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomLetter = letters.charAt(Math.floor(Math.random() * letters.length));
  const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
  return `${randomLetter}${randomDigits}`;
};
