/**
 * Configuration file containing authorized admin email addresses.
 */
export const AUTHORIZED_ADMIN_EMAILS = [
  "abisri024@gmail.com",
  "asanusri2006@gmail.com",
];

/**
 * Helper to verify if a given email is in the authorized admin list
 * @param {string} email 
 * @returns {boolean}
 */
export const isAdminEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  const normalizedEmail = email.trim().toLowerCase();
  return AUTHORIZED_ADMIN_EMAILS.some(
    (adminEmail) => adminEmail.trim().toLowerCase() === normalizedEmail
  );
};

export default AUTHORIZED_ADMIN_EMAILS;
