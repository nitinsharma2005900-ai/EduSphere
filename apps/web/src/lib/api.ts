export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
export const API_HOST_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
export const ANALYTICS_BASE_URL = process.env.NEXT_PUBLIC_ANALYTICS_URL || '/analytics';
let refreshing: Promise<string | null> | null = null;

export async function downloadFile(url: string, token: string | null, name = 'download.pdf') {
  const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${localStorage.getItem('edusphere_token') || token}` } : {} });
  if (!response.ok) throw new Error('Download unavailable. Please sign in and try again.');
  const href = URL.createObjectURL(await response.blob());
  const link = document.createElement('a'); link.href = href; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${typeof window === 'undefined' ? token : localStorage.getItem('edusphere_token') || token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  let response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && token && typeof window !== 'undefined' && !endpoint.startsWith('/auth/')) {
    const refreshToken = localStorage.getItem('edusphere_refresh');
    if (refreshToken) {
      if (!refreshing) refreshing = (async () => {
        const refresh = await fetch(`${API_BASE_URL}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) });
        if (!refresh.ok) return null;
        const result = await refresh.json();
        localStorage.setItem('edusphere_token', result.data.tokens.accessToken);
        localStorage.setItem('edusphere_refresh', result.data.tokens.refreshToken);
        return result.data.tokens.accessToken as string;
      })().finally(() => { refreshing = null; });
      const accessToken = await refreshing;
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
        response = await fetch(url, { ...options, headers });
      }
    }
  }

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.message || 'An error occurred';
    const err = new Error(errorMsg);
    (err as any).status = response.status;
    (err as any).data = data;
    throw err;
  }

  return data.data !== undefined ? data.data : data;
}
