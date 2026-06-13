import prisma from "../../lib/db";
import type { IntegrationProvider } from "@prisma/client";
import { isGoogleConfigured, isZoomConfigured } from "./oauthState";
import { refreshGoogleToken } from "./googleOAuth";
import { refreshZoomToken } from "./zoomOAuth";

export interface IntegrationSummary {
  provider: "GOOGLE" | "ZOOM";
  name: string;
  category: "Calendar" | "Video";
  description: string;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR";
  accountEmail: string | null;
  connectedAt: string | null;
  configured: boolean;
}

const CATALOG: Omit<IntegrationSummary, "status" | "accountEmail" | "connectedAt" | "configured">[] = [
  {
    provider: "GOOGLE",
    name: "Google Calendar & Meet",
    category: "Calendar",
    description: "Sync your Google Calendar and create Google Meet links.",
  },
  {
    provider: "ZOOM",
    name: "Zoom Video",
    category: "Video",
    description: "Automatically create Zoom meetings for bookings.",
  },
];

function isConfigured(provider: IntegrationProvider): boolean {
  return provider === "GOOGLE" ? isGoogleConfigured() : isZoomConfigured();
}

export async function listIntegrations(userId: string): Promise<IntegrationSummary[]> {
  const rows = await prisma.integration.findMany({ where: { userId } });
  const byProvider = new Map(rows.map((r) => [r.provider, r]));

  return CATALOG.map((item) => {
    const row = byProvider.get(item.provider);
    return {
      ...item,
      status: row?.status ?? "DISCONNECTED",
      accountEmail: row?.accountEmail ?? null,
      connectedAt: row?.connectedAt?.toISOString() ?? null,
      configured: isConfigured(item.provider),
    };
  });
}

export async function getConnectedIntegration(
  userId: string,
  provider: IntegrationProvider,
) {
  return prisma.integration.findUnique({
    where: { userId_provider: { userId, provider } },
  });
}

export async function upsertIntegrationTokens(
  userId: string,
  provider: IntegrationProvider,
  data: {
    accessToken: string;
    refreshToken?: string | null;
    expiresAt?: Date | null;
    accountEmail?: string | null;
  },
) {
  return prisma.integration.upsert({
    where: { userId_provider: { userId, provider } },
    create: {
      userId,
      provider,
      status: "CONNECTED",
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? null,
      expiresAt: data.expiresAt ?? null,
      accountEmail: data.accountEmail ?? null,
      connectedAt: new Date(),
    },
    update: {
      status: "CONNECTED",
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? undefined,
      expiresAt: data.expiresAt ?? undefined,
      accountEmail: data.accountEmail ?? undefined,
      connectedAt: new Date(),
    },
  });
}

export async function disconnectIntegration(
  userId: string,
  provider: IntegrationProvider,
) {
  return prisma.integration.upsert({
    where: { userId_provider: { userId, provider } },
    create: {
      userId,
      provider,
      status: "DISCONNECTED",
    },
    update: {
      status: "DISCONNECTED",
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      accountEmail: null,
      connectedAt: null,
    },
  });
}

export async function markIntegrationError(
  userId: string,
  provider: IntegrationProvider,
): Promise<void> {
  await prisma.integration.updateMany({
    where: { userId, provider, status: "CONNECTED" },
    data: { status: "ERROR" },
  });
}

export async function resolvePreferredMeetingProvider(
  userId: string,
): Promise<"GOOGLE_MEET" | "ZOOM" | "CAL_VIDEO"> {
  const integrations = await listIntegrations(userId);
  const google = integrations.find((i) => i.provider === "GOOGLE");
  if (google?.status === "CONNECTED") return "GOOGLE_MEET";
  const zoom = integrations.find((i) => i.provider === "ZOOM");
  if (zoom?.status === "CONNECTED") return "ZOOM";
  return "CAL_VIDEO";
}

export async function getValidAccessToken(
  userId: string,
  provider: IntegrationProvider,
): Promise<string | null> {
  const row = await getConnectedIntegration(userId, provider);
  if (!row || row.status !== "CONNECTED" || !row.accessToken) return null;

  const expiresSoon =
    row.expiresAt && row.expiresAt.getTime() - Date.now() < 60_000;

  if (!expiresSoon) return row.accessToken;

  if (provider === "GOOGLE") {
    return refreshGoogleToken(userId, row);
  }
  if (provider === "ZOOM") {
    return refreshZoomToken(userId, row);
  }
  return row.accessToken;
}
