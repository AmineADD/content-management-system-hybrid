import { createSign } from "node:crypto";
import { BRAND_APEX_HOSTS } from "@/lib/publicUrl";

export const runtime = "nodejs";

const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const INSPECT_URL =
  "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

function base64url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

// Google's JWT-bearer flow for service accounts: sign a claim set with the
// account's private key and swap it for an access token.
async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON is not set — see README (Search Console setup).",
    );
  }

  const account = JSON.parse(raw) as ServiceAccount;
  const issuedAt = Math.floor(Date.now() / 1000);
  const unsigned = [
    base64url(JSON.stringify({ alg: "RS256", typ: "JWT" })),
    base64url(
      JSON.stringify({
        iss: account.client_email,
        scope: SCOPE,
        aud: TOKEN_URL,
        iat: issuedAt,
        exp: issuedAt + 3600,
      }),
    ),
  ].join(".");

  // Keys pasted into a single-line env var keep their newlines escaped.
  const privateKey = account.private_key.replace(/\\n/g, "\n");
  const signature = createSign("RSA-SHA256")
    .update(unsigned)
    .sign(privateKey, "base64url");

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(
      body?.error_description ?? "Google refused the service account token.",
    );
  }

  cachedToken = {
    value: body.access_token as string,
    expiresAt: Date.now() + Number(body.expires_in ?? 3600) * 1000,
  };
  return cachedToken.value;
}

/**
 * GET /api/gsc?url=https://www.happy-milo.com/fr/blog/foo
 * Reports whether Google has the URL indexed, via the Search Console
 * URL Inspection API.
 *
 * ponytail: no result cache — the API allows 2000 inspections/day and the CMS
 * only calls it for the row being edited. Add one if the quota ever bites.
 */
export async function GET(request: Request): Promise<Response> {
  const target = new URL(request.url).searchParams.get("url") ?? "";

  let host: string;
  try {
    const parsed = new URL(target);
    if (parsed.protocol !== "https:") throw new Error("not https");
    host = parsed.hostname;
  } catch {
    return Response.json({ error: "Invalid `url` parameter." }, { status: 400 });
  }

  const apex = host.replace(/^www\./, "");
  if (!BRAND_APEX_HOSTS.has(apex)) {
    return Response.json(
      { error: `${host} is not a Milo domain.` },
      { status: 400 },
    );
  }

  let token: string;
  try {
    token = await getAccessToken();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Google authentication failed.";
    return Response.json({ error: message }, { status: 500 });
  }

  const response = await fetch(INSPECT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inspectionUrl: target,
      // Domain property: covers both the apex and the www host the sites
      // actually canonicalise to.
      siteUrl: `sc-domain:${apex}`,
      languageCode: "en-US",
    }),
  });
  const body = await response.json();

  if (!response.ok) {
    return Response.json(
      {
        error:
          body?.error?.message ?? "Search Console rejected the inspection.",
      },
      { status: response.status },
    );
  }

  const status = body?.inspectionResult?.indexStatusResult ?? {};
  return Response.json({
    verdict: status.verdict ?? "VERDICT_UNSPECIFIED",
    coverageState: status.coverageState ?? "",
    robotsTxtState: status.robotsTxtState ?? "",
    indexingState: status.indexingState ?? "",
    lastCrawlTime: status.lastCrawlTime ?? "",
    googleCanonical: status.googleCanonical ?? "",
    reportUrl: body?.inspectionResult?.inspectionResultLink ?? "",
  });
}
