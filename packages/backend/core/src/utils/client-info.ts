/**
 * Utility functions for extracting client metadata from HTTP headers
 * Used for Meta attribution tracking and fraud prevention
 */

/**
 * Extracts the real client IP address from request headers.
 *
 * When running behind AWS ELB or other load balancers, the real client IP
 * is available in the X-Forwarded-For header (first IP in comma-separated list).
 *
 * @param headers - Request headers
 * @returns Client IP address or undefined if not found
 */
export function getClientIp(headers: Headers): string | undefined {
  // AWS ELB sets X-Forwarded-For with format: client, proxy1, proxy2
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Take the first IP (the client)
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  // Fallback to X-Real-IP header (less common with ELB)
  return headers.get("x-real-ip") || undefined;
}

/**
 * Extracts the User-Agent string from request headers.
 *
 * Used by Meta for device fingerprinting and attribution modeling.
 *
 * @param headers - Request headers
 * @returns User-Agent string or undefined if not found
 */
export function getClientUserAgent(headers: Headers): string | undefined {
  return headers.get("user-agent") || undefined;
}
