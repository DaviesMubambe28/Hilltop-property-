const allowedVerificationTypes = new Set(['application/pdf', 'image/jpeg', 'image/png']);
export const verificationFileLimit = 10 * 1024 * 1024;

export function validateVerificationFile(file: Pick<File, 'size' | 'type' | 'name'>): string | null {
  if (!allowedVerificationTypes.has(file.type)) return 'Use a PDF, JPEG or PNG document.';
  if (file.size <= 0 || file.size > verificationFileLimit) return 'The document must be between 1 byte and 10 MB.';
  if (!file.name.trim()) return 'The document must have a file name.';
  return null;
}

export function safeStorageName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 160) || 'document';
}
