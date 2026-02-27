import "server-only";

const VERCEL_API = "https://api.vercel.com";

function headers() {
  return {
    Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
    "Content-Type": "application/json",
  };
}

function teamQuery() {
  const teamId = process.env.VERCEL_TEAM_ID;
  return teamId && teamId !== "#" ? `?teamId=${teamId}` : "";
}

/**
 * Add a domain to the Vercel project.
 * For apex domains: also adds www. with 308 redirect.
 */
export async function addDomainToVercel(
  domain: string,
  isApex: boolean
): Promise<{ error?: string; verificationData?: unknown }> {
  const projectId = process.env.VERCEL_PROJECT_ID!;
  const url = `${VERCEL_API}/v10/projects/${projectId}/domains${teamQuery()}`;

  const res = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ name: domain }),
  });

  const data = await res.json();

  if (!res.ok && data.error?.code !== "domain_already_exists") {
    return { error: data.error?.message ?? "Failed to add domain to Vercel" };
  }

  // For apex domains, also add www with redirect
  if (isApex) {
    await fetch(url, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        name: `www.${domain}`,
        redirect: domain,
        redirectStatusCode: 308,
      }),
    });
  }

  return { verificationData: data };
}

/**
 * Get domain configuration from Vercel (DNS status, verification records).
 */
export async function getDomainConfig(domain: string) {
  const res = await fetch(
    `${VERCEL_API}/v6/domains/${domain}/config${teamQuery()}`,
    { headers: headers() }
  );
  return res.json();
}

/**
 * Verify a domain on the Vercel project.
 */
export async function verifyDomainOnVercel(domain: string) {
  const projectId = process.env.VERCEL_PROJECT_ID!;
  const res = await fetch(
    `${VERCEL_API}/v9/projects/${projectId}/domains/${domain}/verify${teamQuery()}`,
    { method: "POST", headers: headers() }
  );
  return res.json();
}

/**
 * Remove a domain from the Vercel project.
 * For apex domains: remove www first, then primary.
 */
export async function removeDomainFromVercel(
  domain: string,
  isApex: boolean
): Promise<{ error?: string }> {
  const projectId = process.env.VERCEL_PROJECT_ID!;
  const base = `${VERCEL_API}/v9/projects/${projectId}/domains`;

  // Remove www redirect first if apex (Vercel blocks removing primary while www exists)
  if (isApex) {
    await fetch(`${base}/www.${domain}${teamQuery()}`, {
      method: "DELETE",
      headers: headers(),
    });
  }

  const res = await fetch(`${base}/${domain}${teamQuery()}`, {
    method: "DELETE",
    headers: headers(),
  });

  if (!res.ok) {
    const data = await res.json();
    return { error: data.error?.message ?? "Failed to remove domain" };
  }

  return {};
}
