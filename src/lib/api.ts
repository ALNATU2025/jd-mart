import { auth } from './firebase';

/**
 * Drop-in replacement for fetch() when calling our own /api routes.
 * Adds the signed-in user's Firebase ID token so the server can verify who is calling.
 */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const user = auth.currentUser;
  if (user) {
    try {
      headers.set('Authorization', `Bearer ${await user.getIdToken()}`);
    } catch (err) {
      console.warn('Could not get auth token for API call:', err);
    }
  }
  return fetch(input, { ...init, headers });
}
