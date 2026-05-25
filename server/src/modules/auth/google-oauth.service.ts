import { OAuth2Client } from "google-auth-library";
import { env } from "../../config/env.js";
import { prisma } from "../../database/prisma.js";
import { toPublicUser } from "../users/user.presenter.js";
import { HttpError } from "../../utils/httpError.js";
import { issueTokenPair } from "./auth.service.js";

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export async function verifyGoogleToken(idToken: string) {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new HttpError(401, "AUTHENTICATION_REQUIRED", "Invalid Google token");
    }

    return payload;
  } catch (error: any) {
    throw new HttpError(401, "AUTHENTICATION_REQUIRED", `Google token verification failed: ${error.message}`);
  }
}

export async function authenticateWithGoogle(idToken: string) {
  const payload = await verifyGoogleToken(idToken);

  const email = payload.email?.trim();
  const name = payload.name?.trim() || email?.split("@")[0] || "Student";

  if (!email) {
    throw new HttpError(400, "VALIDATION_ERROR", "Email not provided in Google token");
  }

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    // Create new user from Google data
    user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: "", // Google users don't have password
        country: "DE", // Default country
        studentStatus: "OTHER",
        currency: "EUR",
        settings: {
          create: {
            currency: "EUR",
            workCountry: "DE",
            defaultHourlyWage: null
          }
        }
      }
    });
  }

  // Issue tokens
  const tokens = await issueTokenPair(user.id);

  return {
    user: toPublicUser(user),
    tokens
  };
}
