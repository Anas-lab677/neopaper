import crypto from 'crypto';

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'hackathon-d7f9c';
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyANZsOAxo8CvAvXLzVe_LzAUfd1p_yIfck';
const GOOGLE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

// In-memory cache for Google public certificates
interface CertCache {
  certs: Record<string, string>;
  expiresAt: number;
}
let cachedCerts: CertCache | null = null;

async function getGooglePublicCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedCerts && cachedCerts.expiresAt > now) {
    return cachedCerts.certs;
  }

  try {
    const res = await fetch(GOOGLE_CERTS_URL, {
      headers: { 'User-Agent': 'Daybreak-Server/1.0' },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch Google public certs: ${res.statusText}`);
    }

    // Parse max-age from cache-control header
    let maxAgeSeconds = 3600 * 6; // default 6 hours
    const cacheControl = res.headers.get('cache-control');
    if (cacheControl) {
      const match = cacheControl.match(/max-age=(\d+)/i);
      if (match && match[1]) {
        maxAgeSeconds = parseInt(match[1], 10);
      }
    }

    const certs = (await res.json()) as Record<string, string>;
    cachedCerts = {
      certs,
      expiresAt: now + maxAgeSeconds * 1000,
    };
    return certs;
  } catch (err) {
    console.warn('[Auth] Error fetching Google public certs:', err);
    if (cachedCerts) return cachedCerts.certs; // use stale cache if available
    throw err;
  }
}

export interface VerifiedAuth {
  isAuthenticated: boolean;
  userId: string;
  email?: string;
  error?: string;
}

/**
 * Cryptographically verifies a Firebase ID Token using Google's public certificates.
 * Validates:
 * - RS256 algorithm and public key signature
 * - Audience (must match Firebase Project ID)
 * - Issuer (must match https://securetoken.google.com/<PROJECT_ID>)
 * - Expiration and Issue timestamps
 * - Non-empty subject (uid)
 *
 * Strict security: NO x-user-id fallback!
 */
export async function verifyFirebaseIdToken(token: string): Promise<VerifiedAuth> {
  if (!token || typeof token !== 'string') {
    return { isAuthenticated: false, userId: 'guest', error: 'No token provided' };
  }

  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    return { isAuthenticated: false, userId: 'guest', error: 'Malformed JWT structure' };
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  let header: { alg?: string; kid?: string };
  let payload: {
    iss?: string;
    aud?: string;
    auth_time?: number;
    sub?: string;
    iat?: number;
    exp?: number;
    email?: string;
    user_id?: string;
  };

  try {
    header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf-8'));
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
  } catch (e: any) {
    return { isAuthenticated: false, userId: 'guest', error: 'Invalid JWT encoding' };
  }

  // 1. Check algorithm
  if (header.alg !== 'RS256') {
    return { isAuthenticated: false, userId: 'guest', error: `Unsupported JWT algorithm: ${header.alg}` };
  }

  // 2. Check Key ID
  if (!header.kid) {
    return { isAuthenticated: false, userId: 'guest', error: 'Missing key ID (kid) in token header' };
  }

  // 3. Check timestamps (with 10-second clock-skew allowance)
  const nowSec = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < nowSec - 10) {
    return { isAuthenticated: false, userId: 'guest', error: 'Token has expired' };
  }
  if (!payload.iat || payload.iat > nowSec + 10) {
    return { isAuthenticated: false, userId: 'guest', error: 'Token issued in future' };
  }

  // 4. Check audience & issuer
  const expectedAud = FIREBASE_PROJECT_ID;
  const expectedIss = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;

  if (payload.aud !== expectedAud) {
    return { isAuthenticated: false, userId: 'guest', error: `Audience mismatch: expected ${expectedAud}, got ${payload.aud}` };
  }
  if (payload.iss !== expectedIss) {
    return { isAuthenticated: false, userId: 'guest', error: `Issuer mismatch: expected ${expectedIss}, got ${payload.iss}` };
  }

  // 5. Check subject (UID)
  const uid = payload.sub || payload.user_id;
  if (!uid || typeof uid !== 'string' || uid.length > 128) {
    return { isAuthenticated: false, userId: 'guest', error: 'Invalid or missing user ID in token' };
  }

  // 6. Verify cryptographic signature with Google's public certificate
  try {
    const certs = await getGooglePublicCerts();
    const cert = certs[header.kid];

    if (cert) {
      const dataToVerify = Buffer.from(`${headerB64}.${payloadB64}`);
      const signature = Buffer.from(signatureB64, 'base64url');

      const isVerified = crypto.verify('RSA-SHA256', dataToVerify, cert, signature);
      if (isVerified) {
        return {
          isAuthenticated: true,
          userId: uid,
          email: payload.email,
        };
      }
    }
  } catch (cryptoErr) {
    console.warn('[Auth] Cryptographic verification error, trying Identity Toolkit:', cryptoErr);
  }

  // 7. Secondary Verification: Google Identity Toolkit accounts:lookup API
  if (FIREBASE_API_KEY) {
    try {
      const lookupRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_API_KEY)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: token }),
        }
      );

      if (lookupRes.ok) {
        const data = (await lookupRes.json()) as { users?: Array<{ localId: string; email?: string }> };
        if (data.users && data.users.length > 0 && data.users[0].localId === uid) {
          return {
            isAuthenticated: true,
            userId: data.users[0].localId,
            email: data.users[0].email || payload.email,
          };
        }
      }
    } catch (apiErr) {
      console.warn('[Auth] Google Identity Toolkit fallback failed:', apiErr);
    }
  }

  return { isAuthenticated: false, userId: 'guest', error: 'Invalid token signature' };
}

/**
 * Extracts and verifies the user ID from Express request headers.
 * Strictly verifies the Bearer token and rejects unverified tokens.
 * Completely eliminates any unverified x-user-id fallback.
 */
export async function getVerifiedUserId(req: any): Promise<VerifiedAuth> {
  const authHeader = req.headers.authorization || req.headers['authorization'];
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      return await verifyFirebaseIdToken(token);
    }
  }

  // Unauthenticated guest request
  return { isAuthenticated: false, userId: 'guest' };
}
