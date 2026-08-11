import * as cookie from "cookie";
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Session } from "@contracts/constants";
import { createRouter, publicQuery } from "./middleware";
import { getSessionCookieOptions } from "./lib/cookies";
import { signSessionToken } from "./kimi/session";
import { findUserByUnionId, upsertUser } from "./queries/users";
import { env } from "./lib/env";

/**
 * Login con email + contraseña — alternativa a Kimi OAuth.
 * Reutiliza la misma sesión JWT (cookie kimi_sid) que el resto de la app.
 * Las contraseñas se guardan con scrypt (salt:hash), nunca en claro.
 */

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, 64);
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  const derived = await scryptAsync(password, salt, 64);
  const expected = Buffer.from(hashHex, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

const emailToUnionId = (email: string) => `email:${email.trim().toLowerCase()}`;

function setSessionCookie(
  resHeaders: Headers,
  reqHeaders: Headers,
  token: string,
) {
  const opts = getSessionCookieOptions(reqHeaders);
  resHeaders.append(
    "set-cookie",
    cookie.serialize(Session.cookieName, token, {
      httpOnly: opts.httpOnly,
      path: opts.path,
      sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
      secure: opts.secure,
      maxAge: Session.maxAgeMs / 1000,
    }),
  );
}

const emailSchema = z.string().trim().toLowerCase().email("Email no válido").max(320);
const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(72, "Máximo 72 caracteres");

export const emailAuthRouter = createRouter({
  register: publicQuery
    .input(
      z.object({
        name: z.string().trim().min(1, "Dinos tu nombre").max(120),
        email: emailSchema,
        password: passwordSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const unionId = emailToUnionId(input.email);
      const existing = await findUserByUnionId(unionId);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ya existe una cuenta con ese email. Inicia sesión.",
        });
      }
      const passwordHash = await hashPassword(input.password);
      await upsertUser({
        unionId,
        name: input.name,
        email: input.email,
        passwordHash,
        lastSignInAt: new Date(),
      });
      const token = await signSessionToken({ unionId, clientId: env.appId });
      setSessionCookie(ctx.resHeaders, ctx.req.headers, token);
      return { ok: true, name: input.name };
    }),

  login: publicQuery
    .input(z.object({ email: emailSchema, password: z.string().min(1).max(72) }))
    .mutation(async ({ ctx, input }) => {
      const unionId = emailToUnionId(input.email);
      const user = await findUserByUnionId(unionId);
      if (!user?.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email o contraseña incorrectos.",
        });
      }
      const valid = await verifyPassword(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email o contraseña incorrectos.",
        });
      }
      await upsertUser({ unionId, lastSignInAt: new Date() });
      const token = await signSessionToken({ unionId, clientId: env.appId });
      setSessionCookie(ctx.resHeaders, ctx.req.headers, token);
      return { ok: true, name: user.name };
    }),
});
