type SessionExpiredHandler = () => void;

let onSessionExpired: SessionExpiredHandler | null = null;

export function registerSessionExpiredHandler(handler: SessionExpiredHandler | null) {
  onSessionExpired = handler;
}

export function notifySessionExpired() {
  onSessionExpired?.();
}

interface JwtPayload {
  exp?: number;
  type?: string;
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as JwtPayload;
  } catch {
    return null;
  }
}

export function isAccessTokenExpiringSoon(token: string, bufferSeconds = 90): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp || payload.type !== 'access') {
    return true;
  }
  return payload.exp * 1000 <= Date.now() + bufferSeconds * 1000;
}
