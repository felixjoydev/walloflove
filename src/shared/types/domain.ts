export type DomainVercelStatus =
  | "none"
  | "pending_add"
  | "pending_dns"
  | "verified"
  | "error";

export interface DomainVerificationData {
  verification?: Array<{
    type: string;
    domain: string;
    value: string;
  }>;
  isApex?: boolean;
}

export interface DnsRecord {
  type: "TXT" | "A" | "CNAME";
  name: string;
  value: string;
}
