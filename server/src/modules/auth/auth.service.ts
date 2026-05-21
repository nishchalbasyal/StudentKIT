import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { env } from "../../config/env.js";
import { prisma } from "../../database/prisma.js";
import { durationToMs } from "../../utils/duration.js";
import { HttpError } from "../../utils/httpError.js";
import type { LoginInput, RegisterInput, UpdateProfileInput } from "./auth.schemas.js";

const passwordRounds = 12;

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  country: string;
  studentStatus: string;
  hourlyWageDefault: unknown;
  currency: string;
  avatarUrl?: string | null;
  university?: string | null;
  course?: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    country: user.country,
    studentStatus: user.studentStatus,
    hourlyWageDefault: user.hourlyWageDefault,
    currency: user.currency,
    avatarUrl: user.avatarUrl ?? null,
    university: user.university ?? null,
    course: user.course ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueTokenPair(userId: string) {
  const accessToken = jwt.sign(
    { sub: userId },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN } as SignOptions
  );
  const refreshToken = randomBytes(48).toString("base64url");
  const expiresAt = new Date(Date.now() + durationToMs(env.JWT_REFRESH_EXPIRES_IN));

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt
    }
  });

  return {
    accessToken,
    refreshToken,
    refreshTokenExpiresAt: expiresAt
  };
}

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });

  if (existing) {
    throw new HttpError(409, "CONFLICT", "Email is already registered");
  }

  const passwordHash = await bcrypt.hash(input.password, passwordRounds);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      country: input.country.toUpperCase(),
      studentStatus: input.studentStatus,
      hourlyWageDefault: input.hourlyWageDefault,
      currency: input.currency.toUpperCase(),
      settings: {
        create: {
          currency: input.currency.toUpperCase(),
          workCountry: input.country.toUpperCase(),
          defaultHourlyWage: input.hourlyWageDefault ?? null
        }
      }
    }
  });
  const tokens = await issueTokenPair(user.id);

  return {
    user: publicUser(user),
    tokens
  };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    throw new HttpError(401, "AUTHENTICATION_REQUIRED", "Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new HttpError(401, "AUTHENTICATION_REQUIRED", "Invalid email or password");
  }

  const tokens = await issueTokenPair(user.id);

  return {
    user: publicUser(user),
    tokens
  };
}

export async function refreshToken(rawRefreshToken: string) {
  const tokenHash = hashToken(rawRefreshToken);
  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true }
  });

  if (!storedToken || storedToken.revokedAt || storedToken.expiresAt <= new Date()) {
    throw new HttpError(401, "AUTHENTICATION_REQUIRED", "Invalid or expired refresh token");
  }

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() }
  });

  const tokens = await issueTokenPair(storedToken.userId);

  return {
    user: publicUser(storedToken.user),
    tokens
  };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new HttpError(404, "NOT_FOUND", "User not found");
  }

  return publicUser(user);
}

export async function updateUserProfile(userId: string, input: UpdateProfileInput) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...input,
      country: input.country?.toUpperCase(),
      currency: input.currency?.toUpperCase()
    }
  });

  return publicUser(user);
}
