/**
 * Generates a random 6-digit numeric OTP code as a string.
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Checks if an OTP is expired (e.g., after 10 minutes).
 * @param timestamp The timestamp when the OTP was created (ISO string)
 * @param minutesValidity Validity period in minutes
 */
export const isOTPExpired = (timestamp: string, minutesValidity: number = 10): boolean => {
  const created = new Date(timestamp).getTime();
  const now = new Date().getTime();
  return now - created > minutesValidity * 60 * 1000;
};
