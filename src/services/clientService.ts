import { apiService } from './api';
import { User } from '@auth0/auth0-react';
import { getClientId } from '@/utils/clientId';

interface ClientInfo {
  success: boolean;
  client_id: string;
  client_name?: string;
  status?: string;
  created_at?: string;
  error?: string;
}

// In-memory cache for client info
let cachedClientInfo: ClientInfo | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch client information from the backend API
 * Includes caching to avoid repeated API calls
 */
export async function fetchClientInfo(user: User | undefined): Promise<ClientInfo | null> {
  console.log('🔍 fetchClientInfo called, user:', user?.sub);
  
  // Check if we have valid cached data
  const now = Date.now();
  if (cachedClientInfo && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('✅ Using cached client info:', cachedClientInfo.client_name);
    return cachedClientInfo;
  }

  const clientId = getClientId(user);
  console.log('🔍 Extracted client_id:', clientId);
  
  if (!clientId) {
    console.log('📋 No client_id found, skipping API call');
    return null;
  }

  try {
    console.log(`🌐 Calling API: /api/client/info?client_id=${clientId}`);
    const response = await apiService.get(`/api/client/info?client_id=${clientId}`);
    console.log('📦 API Response:', response.data);
    const data = response.data as ClientInfo;

    if (data.success && data.client_name) {
      console.log(`✅ Fetched client name from API: ${data.client_name}`);
      cachedClientInfo = data;
      cacheTimestamp = now;
      return data;
    } else {
      console.log('⚠️ Client info not found in database');
      return null;
    }
  } catch (error) {
    console.error('❌ Failed to fetch client info:', error);
    return null;
  }
}

/**
 * Clear the client info cache
 * Call this when user logs out or switches context
 */
export function clearClientInfoCache() {
  cachedClientInfo = null;
  cacheTimestamp = 0;
}

