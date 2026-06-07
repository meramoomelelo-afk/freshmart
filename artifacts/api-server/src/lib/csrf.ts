import { randomUUID } from "crypto";
import type { Request, Response, NextFunction } from "express";

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function csrfTokenEndpoint(req: Request, res: Response): void {
  let token = req.cookies?.[CSRF_COOKIE];
  if (!token) {
    token = randomUUID();
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });
  }
  res.json({ csrfToken: token });
}

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const hasCookieAuth = req.cookies?.user_token || req.cookies?.admin_token;
  if (!hasCookieAuth) {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({ error: "Forbidden", message: "Invalid or missing CSRF token" });
    return;
  }

  next();
}
