import crypto from "crypto";

const STATE_TTL_MS = 10 * 60 * 1000;

function stateSecret(): string {
  return process.env.OAUTH_STATE_SECRET ?? "cal-clone-oauth-dev-secret";
}

export function signOAuthState(payload: {
  provider: string;
  userId: string;
}): string {
  const ts = Date.now();
  const data = JSON.stringify({ ...payload, ts });
  const sig = crypto.createHmac("sha256", stateSecret()).update(data).digest("hex");
  return Buffer.from(JSON.stringify({ ...payload, ts, sig })).toString("base64url");
}

export function verifyOAuthState(
  state: string,
  expectedProvider: string,
): { userId: string } | null {
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as {
      provider: string;
      userId: string;
      ts: number;
      sig: string;
    };
    if (Date.now() - parsed.ts > STATE_TTL_MS) return null;
    if (parsed.provider !== expectedProvider) return null;
    const data = JSON.stringify({
      provider: parsed.provider,
      userId: parsed.userId,
      ts: parsed.ts,
    });
    const expected = crypto
      .createHmac("sha256", stateSecret())
      .update(data)
      .digest("hex");
    if (expected !== parsed.sig) return null;
    return { userId: parsed.userId };
  } catch {
    return null;
  }
}

export function frontendAppsUrl(query: Record<string, string>): string {
  const base = process.env.FRONTEND_URL ?? "http://localhost:3000";
  const q = new URLSearchParams(query).toString();
  return `${base}/apps${q ? `?${q}` : ""}`;
}

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function isZoomConfigured(): boolean {
  return Boolean(process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET);
}
