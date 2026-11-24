import type { AuthTokenClaims } from './utils/authTokens.ts';

export interface AuthenticatedUser {
  id: string;
  firebase_uid: string | null;
  username: string;
  role: string;
  is_banned: boolean;
}

declare module 'hono' {
  interface ContextVariableMap {
    requestId: string;
    authUser: AuthenticatedUser;
    authClaims: AuthTokenClaims;
  }
}
