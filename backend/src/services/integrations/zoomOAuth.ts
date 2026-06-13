import type { Integration } from "@prisma/client";
import { ApiError } from "../../middleware/errorHandler";
import {
  isZoomConfigured,
  signOAuthState,
} from "./oauthState";
import { upsertIntegrationTokens } from "./integrationStore";

const ZOOM_AUTH = "https://zoom.us/oauth/authorize";
const ZOOM_TOKEN = "https://zoom.us/oauth/token";
const ZOOM_USER = "https://api.zoom.us/v2/users/me";

const ZOOM_SCOPES = [
  "user:read",
  "meeting:write:meeting",
  "meeting:write:meeting:admin",
].join(" ");

export function getZoomAuthUrl(userId: string): string {
  if (!isZoomConfigured()) {
    throw new ApiError(
      503,
      "NOT_CONFIGURED",
      "Zoom OAuth is not configured. Set ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET in backend/.env",
    );
  }
  const redirectUri =
    process.env.ZOOM_REDIRECT_URI ??
    "http://localhost:4000/api/integrations/zoom/callback";
  const state = signOAuthState({ provider: "zoom", userId });
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.ZOOM_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: ZOOM_SCOPES,
    state,
  });
  return `${ZOOM_AUTH}?${params.toString()}`;
}

function zoomBasicAuth(): string {
  const id = process.env.ZOOM_CLIENT_ID!;
  const secret = process.env.ZOOM_CLIENT_SECRET!;
  return Buffer.from(`${id}:${secret}`).toString("base64");
}

export async function handleZoomCallback(code: string, userId: string): Promise<void> {
  const redirectUri =
    process.env.ZOOM_REDIRECT_URI ??
    "http://localhost:4000/api/integrations/zoom/callback";

  const tokenRes = await fetch(
    `${ZOOM_TOKEN}?grant_type=authorization_code&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirectUri)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${zoomBasicAuth()}`,
      },
    },
  );

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    throw new Error(`Zoom token exchange failed: ${body}`);
  }

  const tokens = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  let accountEmail: string | null = null;
  const userRes = await fetch(ZOOM_USER, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (userRes.ok) {
    const user = (await userRes.json()) as { email?: string };
    accountEmail = user.email ?? null;
  }

  await upsertIntegrationTokens(userId, "ZOOM", {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    expiresAt: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null,
    accountEmail,
  });
}

export async function refreshZoomToken(
  userId: string,
  row: Integration,
): Promise<string | null> {
  if (!row.refreshToken) return row.accessToken;

  const tokenRes = await fetch(
    `${ZOOM_TOKEN}?grant_type=refresh_token&refresh_token=${encodeURIComponent(row.refreshToken)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${zoomBasicAuth()}`,
      },
    },
  );

  if (!tokenRes.ok) return row.accessToken;

  const tokens = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  await upsertIntegrationTokens(userId, "ZOOM", {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? row.refreshToken,
    expiresAt: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : row.expiresAt,
    accountEmail: row.accountEmail,
  });

  return tokens.access_token;
}

export async function revokeZoomToken(accessToken: string): Promise<void> {
  try {
    await fetch(`${ZOOM_TOKEN}?token=${encodeURIComponent(accessToken)}`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${zoomBasicAuth()}`,
      },
    });
  } catch {
    /* best effort */
  }
}
