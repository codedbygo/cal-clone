import type { Integration } from "@prisma/client";
import { ApiError } from "../../middleware/errorHandler";
import {
  isGoogleConfigured,
  signOAuthState,
} from "./oauthState";
import { upsertIntegrationTokens } from "./integrationStore";

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO = "https://www.googleapis.com/oauth2/v2/userinfo";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "email",
  "profile",
].join(" ");

export function getGoogleAuthUrl(userId: string): string {
  if (!isGoogleConfigured()) {
    throw new ApiError(
      503,
      "NOT_CONFIGURED",
      "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env",
    );
  }
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ??
    "http://localhost:4000/api/integrations/google/callback";
  const state = signOAuthState({ provider: "google", userId });
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${GOOGLE_AUTH}?${params.toString()}`;
}

export async function handleGoogleCallback(
  code: string,
  userId: string,
): Promise<void> {
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ??
    "http://localhost:4000/api/integrations/google/callback";

  const tokenRes = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${body}`);
  }

  const tokens = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  let accountEmail: string | null = null;
  const userRes = await fetch(GOOGLE_USERINFO, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (userRes.ok) {
    const user = (await userRes.json()) as { email?: string };
    accountEmail = user.email ?? null;
  }

  await upsertIntegrationTokens(userId, "GOOGLE", {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    expiresAt: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null,
    accountEmail,
  });
}

export async function refreshGoogleToken(
  userId: string,
  row: Integration,
): Promise<string | null> {
  if (!row.refreshToken) return row.accessToken;

  const tokenRes = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: row.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!tokenRes.ok) return row.accessToken;

  const tokens = (await tokenRes.json()) as {
    access_token: string;
    expires_in?: number;
  };

  await upsertIntegrationTokens(userId, "GOOGLE", {
    accessToken: tokens.access_token,
    refreshToken: row.refreshToken,
    expiresAt: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : row.expiresAt,
    accountEmail: row.accountEmail,
  });

  return tokens.access_token;
}

export async function revokeGoogleToken(accessToken: string): Promise<void> {
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
      method: "POST",
    });
  } catch {
    /* best effort */
  }
}
