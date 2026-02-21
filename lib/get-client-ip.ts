import { NextRequest } from 'next/server';

/**
 * Capture client IP from request (Vercel/proxy-friendly).
 * Use for audit: submitted_ip, approval_ip, edit_ip.
 */
export function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? null;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return null;
}
