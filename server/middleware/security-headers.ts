/**
 * Hardening for production (Nitro). Dev Vite does not load this file.
 * Preview iframe must keep working — do not set X-Frame-Options: DENY.
 */
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Permitted-Cross-Domain-Policies": "none",
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), midi=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "frame-src 'self' https://www.youtube-nocookie.com https://player.vimeo.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "script-src 'self' 'unsafe-inline'",
    "connect-src 'self' https:",
    "worker-src 'self' blob:",
    "upgrade-insecure-requests",
  ].join("; "),
};

export default async function securityHeadersMiddleware(
  _event: unknown,
  next: () => unknown | Promise<unknown>,
): Promise<unknown> {
  const result = await next();
  if (!(result instanceof Response)) return result;
  const headers = new Headers(result.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(key)) headers.set(key, value);
  }
  return new Response(result.body, {
    status: result.status,
    statusText: result.statusText,
    headers,
  });
}
