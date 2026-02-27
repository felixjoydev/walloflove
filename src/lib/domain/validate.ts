import { parse as parseDomain } from "tldts";

const BLOCKED_DOMAINS = [
  "localhost",
  "vercel.app",
  "vercel.dev",
  "now.sh",
  "netlify.app",
  "herokuapp.com",
  "guestbook.sh",
  "supabase.co",
  "supabase.com",
];

export interface DomainValidationResult {
  valid: boolean;
  error?: string;
  hostname?: string;
  isApex?: boolean;
}

export function validateDomain(input: string): DomainValidationResult {
  let hostname = input
    .trim()
    .toLowerCase()
    .replace(/^(https?:\/\/)/, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");

  if (!hostname) {
    return { valid: false, error: "Domain is required" };
  }

  const parsed = parseDomain(hostname);

  if (!parsed.domain || !parsed.isIcann) {
    return { valid: false, error: "Invalid domain name" };
  }

  for (const blocked of BLOCKED_DOMAINS) {
    if (hostname === blocked || hostname.endsWith(`.${blocked}`)) {
      return { valid: false, error: `${blocked} domains are not allowed` };
    }
  }

  if (hostname.length > 253) {
    return { valid: false, error: "Domain name is too long" };
  }

  const labels = hostname.split(".");
  for (const label of labels) {
    if (label.length > 63) {
      return { valid: false, error: "Domain label exceeds 63 characters" };
    }
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(label)) {
      return { valid: false, error: "Domain contains invalid characters" };
    }
  }

  const isApex = !parsed.subdomain;

  return { valid: true, hostname, isApex };
}
