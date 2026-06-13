import { Router } from "express";
import { getDefaultUserId } from "../lib/constants";
import { ApiError } from "../middleware/errorHandler";
import {
  disconnectIntegration,
  getConnectedIntegration,
  listIntegrations,
} from "../services/integrations/integrationStore";
import { getGoogleAuthUrl, handleGoogleCallback, revokeGoogleToken } from "../services/integrations/googleOAuth";
import { getZoomAuthUrl, handleZoomCallback, revokeZoomToken } from "../services/integrations/zoomOAuth";
import { frontendAppsUrl, verifyOAuthState } from "../services/integrations/oauthState";
import { invalidateBootstrapCache } from "./slots";

const router = Router();

type ProviderParam = "google" | "zoom";

function parseProvider(raw: string): ProviderParam {
  if (raw === "google" || raw === "zoom") return raw;
  throw new ApiError(400, "VALIDATION", "Invalid integration provider");
}

// GET /api/integrations
router.get("/", async (_req, res, next) => {
  try {
    const userId = await getDefaultUserId();
    const integrations = await listIntegrations(userId);
    res.json(integrations);
  } catch (err) {
    next(err);
  }
});

// GET /api/integrations/:provider/auth-url
router.get("/:provider/auth-url", async (req, res, next) => {
  try {
    const provider = parseProvider(req.params.provider);
    const userId = await getDefaultUserId();
    const url =
      provider === "google"
        ? getGoogleAuthUrl(userId)
        : getZoomAuthUrl(userId);
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

// GET /api/integrations/:provider/callback
router.get("/:provider/callback", async (req, res, next) => {
  try {
    const provider = parseProvider(req.params.provider);
    const code = typeof req.query.code === "string" ? req.query.code : null;
    const state = typeof req.query.state === "string" ? req.query.state : null;
    const oauthError = typeof req.query.error === "string" ? req.query.error : null;

    if (oauthError) {
      res.redirect(frontendAppsUrl({ error: oauthError }));
      return;
    }
    if (!code || !state) {
      res.redirect(frontendAppsUrl({ error: "missing_code" }));
      return;
    }

    const verified = verifyOAuthState(state, provider);
    if (!verified) {
      res.redirect(frontendAppsUrl({ error: "invalid_state" }));
      return;
    }

    if (provider === "google") {
      await handleGoogleCallback(code, verified.userId);
    } else {
      await handleZoomCallback(code, verified.userId);
    }

    invalidateBootstrapCache();
    res.redirect(frontendAppsUrl({ connected: provider }));
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.redirect(frontendAppsUrl({ error: "oauth_failed" }));
  }
});

// DELETE /api/integrations/:provider
router.delete("/:provider", async (req, res, next) => {
  try {
    const provider = parseProvider(req.params.provider);
    const userId = await getDefaultUserId();
    const row = await getConnectedIntegration(
      userId,
      provider === "google" ? "GOOGLE" : "ZOOM",
    );

    if (row?.accessToken) {
      if (provider === "google") {
        await revokeGoogleToken(row.accessToken);
      } else {
        await revokeZoomToken(row.accessToken);
      }
    }

    await disconnectIntegration(userId, provider === "google" ? "GOOGLE" : "ZOOM");
    invalidateBootstrapCache();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
