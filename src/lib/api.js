import axios from "axios";
import { BASE_URL, STORAGE } from "./constants";

// In dev we go through the Vite same-origin proxy (the Render API has no CORS);
// in a production build we call the API directly.
export const API_ROOT = import.meta.env.DEV ? "/api" : `${BASE_URL}/api`;

/**
 * Single Dio-equivalent axios client for the whole app.
 * - attaches the JWT bearer token
 * - unwraps the standard { success, message, data, ... } envelope
 * - transparently refreshes the access token on 401 and replays the request
 */
export const api = axios.create({
  baseURL: API_ROOT,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

export function getToken() {
  return localStorage.getItem(STORAGE.token);
}
export function setTokens({ access_token, refresh_token }) {
  if (access_token) localStorage.setItem(STORAGE.token, access_token);
  if (refresh_token) localStorage.setItem(STORAGE.refresh, refresh_token);
}
export function clearAuth() {
  localStorage.removeItem(STORAGE.token);
  localStorage.removeItem(STORAGE.refresh);
  localStorage.removeItem(STORAGE.userId);
  localStorage.removeItem(STORAGE.user);
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    if (response?.status === 401 && !config._retried) {
      const refresh = localStorage.getItem(STORAGE.refresh);
      if (refresh) {
        try {
          config._retried = true;
          refreshing =
            refreshing ||
            axios.post(`${API_ROOT}/auth/refresh`, { refresh_token: refresh });
          const r = await refreshing;
          refreshing = null;
          const data = r.data?.data || r.data;
          setTokens(data);
          config.headers.Authorization = `Bearer ${data.access_token}`;
          return api(config);
        } catch (e) {
          refreshing = null;
          clearAuth();
          // Only force the login screen on auth-required routes. Public pages
          // (home/explore/story/reader/chat-stories) keep working anonymously —
          // opening the site must always land on content, never on login.
          const p = location.pathname;
          const needsAuth = ["/profile/edit", "/creator", "/become-creator"]
            .some((r) => p.startsWith(r));
          if (needsAuth && p !== "/login") location.href = "/login";
          return Promise.reject(e);
        }
      }
    }
    return Promise.reject(error);
  }
);

/** Pull the `data` field out of the API envelope. */
export function unwrap(res) {
  const body = res?.data;
  if (body && typeof body === "object" && "data" in body) return body.data;
  return body;
}

/** Human-readable message from an axios error following the API envelope. */
export function errMsg(error, fallback = "Something went wrong") {
  const body = error?.response?.data;
  if (body?.message) return body.message;
  if (Array.isArray(body?.errors) && body.errors.length) return body.errors[0];
  if (error?.message === "Network Error") return "Network error — check your connection";
  return fallback;
}

/**
 * True when a write most likely still succeeded server-side despite the request
 * "failing" for the client: a genuine network failure (no response) or any 5xx.
 * The comments endpoint INSERTs the row BEFORE a non-transactional XP update that
 * can throw (the reader_rank enum bug), so the comment lands even though the POST
 * returns 500 — and cross-origin that 500 (lacking CORS headers) surfaces to axios
 * as a plain "Network Error". Callers use this to reconcile silently instead of
 * showing a false error for a write that actually went through. 4xx (auth,
 * validation, rate-limit) is a real failure and is NOT treated as success.
 */
export function writeLikelySucceeded(error) {
  if (error?.message === "Network Error") return true;
  const status = error?.response?.status;
  return typeof status === "number" && status >= 500;
}

// Thin GET/POST helpers that already unwrap the envelope.
export const get = (url, config) => api.get(url, config).then(unwrap);
export const post = (url, data, config) => api.post(url, data, config).then(unwrap);
export const put = (url, data, config) => api.put(url, data, config).then(unwrap);
export const del = (url, config) => api.delete(url, config).then(unwrap);
