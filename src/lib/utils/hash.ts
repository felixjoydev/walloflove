import { createHash } from "crypto";

/**
 * Generate an ephemeral visitor hash from IP + guestbook ID + daily salt.
 * The daily rotation means old hashes become unlinkable — GDPR-friendly.
 */
export function visitorHash(
  ip: string,
  guestbookId: string,
  salt: string
): string {
  const dailySalt = `${salt}-${new Date().toISOString().slice(0, 10)}`;
  return createHash("sha256")
    .update(`${ip}:${guestbookId}:${dailySalt}`)
    .digest("hex");
}
