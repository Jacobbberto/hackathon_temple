import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Where the backend lives. Set EXPO_PUBLIC_API_URL for deployed builds; in development we
 * guess from the Expo dev server's host so a phone running Expo Go finds your laptop.
 */
function resolveApiUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');

  if (Platform.OS === 'web') {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${host || 'localhost'}:8000`;
  }
  const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (devHost) return `http://${devHost}:8000`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
}

export const API_URL = resolveApiUrl();

export class ApiError extends Error {}

export async function getJson<T>(path: string): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(`${API_URL}${path}`, { headers: { Accept: 'application/json' } });
  } catch {
    throw new ApiError(`Can't reach the PhillyPulse backend at ${API_URL}`);
  }
  if (!resp.ok) throw new ApiError(`Backend returned ${resp.status} for ${path}`);
  return (await resp.json()) as T;
}
