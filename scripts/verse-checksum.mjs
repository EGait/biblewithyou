import { createHash } from "node:crypto";

// Ties a verse's text to its reference. If either is edited by hand after
// verification, the checksum no longer matches and the build fails.
export function checksum(ref, text) {
  return createHash("sha256").update(`WEB|${ref}|${text}`).digest("hex").slice(0, 16);
}
