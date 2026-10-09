import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { StandaloneEngine } from '../services/standaloneEngine';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Detect if running on static cloud hosting (e.g. GitHub Pages) where localhost:8000 is unavailable or mixed-content blocked
const isStaticHosting =
  typeof window !== 'undefined' &&
  (window.location.hostname.includes('github.io') ||
    window.location.hostname.includes('pages.dev') ||
    (window.location.protocol === 'https:' && API_BASE_URL.startsWith('http://localhost')));

const standaloneAdapter = async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
  const engine = StandaloneEngine.getInstance();
  const url = config.url || '';
  const method = config.method || 'GET';
  let data = config.data;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      // Keep as string
    }
  }
  const params = config.params;

  try {
    const responseData = await engine.handleRequest(url, method, data, params);
    return {
      data: responseData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config as any,
    };
  } catch (err: any) {
    if (err.response) {
      return Promise.reject(err);
    }
    return Promise.reject({
      response: {
        status: 400,
        data: { detail: err.message || 'Operation failed' },
      },
      config,
    });
  }
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  adapter: isStaticHosting ? (standaloneAdapter as any) : undefined,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('bhumisetu_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If running in development and local FastAPI is down, fall back to standalone engine
    if (!isStaticHosting && (!error.response || error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED')) {
      try {
        console.warn('[BHUMISETU] Local backend unreachable. Falling back to Standalone Engine.');
        return await standaloneAdapter(error.config);
      } catch (fallbackError) {
        return Promise.reject(fallbackError);
      }
    }

    if (error.response?.status === 401) {
      if (!error.config?.url?.includes('/auth/login')) {
        localStorage.removeItem('bhumisetu_token');
        localStorage.removeItem('bhumisetu_user');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
