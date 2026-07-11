import { create } from "zustand";
import { api, setTokens, clearAuth, unwrap } from "../lib/api";
import { STORAGE } from "../lib/constants";

function loadUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE.user) || "null");
  } catch {
    return null;
  }
}
function saveUser(u) {
  if (u) localStorage.setItem(STORAGE.user, JSON.stringify(u));
  else localStorage.removeItem(STORAGE.user);
}

export const useAuth = create((set, get) => ({
  user: loadUser(),
  token: localStorage.getItem(STORAGE.token),
  ready: false,
  isAuthed: () => !!localStorage.getItem(STORAGE.token),

  // Hydrate fresh profile on app boot if we have a token.
  init: async () => {
    const token = localStorage.getItem(STORAGE.token);
    if (!token) {
      set({ ready: true });
      return;
    }
    try {
      const me = await get().fetchMe();
      set({ user: me, ready: true });
    } catch {
      set({ ready: true });
    }
  },

  fetchMe: async () => {
    const profile = await api.get("/users/me").then(unwrap);
    saveUser(profile);
    set({ user: profile });
    return profile;
  },

  login: async (email_or_username, password) => {
    const res = await api.post("/auth/login", { email_or_username, password });
    const data = unwrap(res);
    setTokens(data);
    if (data.user?.id) localStorage.setItem(STORAGE.userId, data.user.id);
    saveUser(data.user);
    set({ user: data.user, token: data.access_token });
    // pull full profile for richer fields
    get().fetchMe().catch(() => {});
    return data.user;
  },

  register: async (payload) => {
    const res = await api.post("/auth/register", payload);
    return unwrap(res);
  },

  googleLogin: async (id_token) => {
    const res = await api.post("/auth/google", { id_token });
    const data = unwrap(res);
    setTokens(data);
    saveUser(data.user);
    set({ user: data.user, token: data.access_token });
    get().fetchMe().catch(() => {});
    return data.user;
  },

  setUser: (u) => {
    saveUser(u);
    set({ user: u });
  },

  // Reflect a successful become-creator locally so the UI flips to creator right
  // away — even if the follow-up /users/me refetch fails (e.g. API cold-start).
  // The server has already set is_creator + role; fetchMe reconciles the rest.
  promoteToCreator: () => {
    const u = get().user;
    if (!u) return;
    const nu = { ...u, is_creator: true, role: "creator" };
    saveUser(nu);
    set({ user: nu });
  },

  logout: async () => {
    const refresh = localStorage.getItem(STORAGE.refresh);
    try {
      if (refresh) await api.post("/auth/logout", { refresh_token: refresh });
    } catch {
      /* ignore */
    }
    clearAuth();
    set({ user: null, token: null });
  },
}));
