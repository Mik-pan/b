import crypto from "node:crypto";
import { cookies, headers } from "next/headers";

const SESSION_COOKIE = "sid";
const ONE_YEAR = 60 * 60 * 24 * 365;

type SessionOptions = {
  create?: boolean;
};

const getSessionId = async (options?: SessionOptions) => {
  const store = await cookies();
  const existing = store.get(SESSION_COOKIE)?.value;
  if (existing) return existing;

  if (!options?.create) return undefined;

  const fresh = crypto.randomUUID();
  store.set(SESSION_COOKIE, fresh, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: ONE_YEAR,
    path: "/",
  });

  return fresh;
};

const hashIp = (ip: string) =>
  crypto.createHash("sha256").update(ip).digest("hex");

export const getClientIdentity = async (options?: { createCookie?: boolean }) => {
  const sessionId = await getSessionId({ create: options?.createCookie });
  const hdrs = await headers();
  const forwarded =
    hdrs.get("x-forwarded-for") ??
    hdrs.get("x-real-ip") ??
    hdrs.get("x-client-ip") ??
    "";
  const ip = forwarded.split(",")[0]?.trim();
  const ipHash = ip ? hashIp(ip) : undefined;

  return { sessionId, ipHash };
};
