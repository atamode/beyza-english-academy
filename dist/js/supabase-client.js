import { SUPABASE_CONFIG, assertPublicSupabaseConfig } from "./account-config.js";

let singleton = null;

const jsonHeaders = { "Content-Type": "application/json" };

function authError(error) {
  const msg = error?.message || error?.error_description || error?.error || "İşlem tamamlanamadı.";
  if (/invalid login|invalid credentials/i.test(msg)) return "E-posta veya şifre hatalı.";
  if (/password/i.test(msg)) return "Şifre en az 8 karakter olmalı.";
  if (/already registered|already exists/i.test(msg)) return "Bu e-posta ile kayıt zaten var.";
  if (/fetch|network|failed/i.test(msg)) return "Bağlantı yok gibi görünüyor. İnterneti kontrol edip tekrar dene.";
  return msg;
}

export function createPomaSupabaseClient(config = SUPABASE_CONFIG, fetchImpl = globalThis.fetch) {
  assertPublicSupabaseConfig(config);
  const base = config.url.replace(/\/+$/, "");
  const anon = config.publishableKey;
  const storage = globalThis.localStorage;
  let accessToken = null;

  const headers = (extra = {}) => ({
    apikey: anon,
    Authorization: `Bearer ${accessToken || anon}`,
    ...extra
  });

  async function request(path, options = {}) {
    if (!fetchImpl) throw new Error("Tarayıcı fetch desteği bulunamadı.");
    const res = await fetchImpl(`${base}${path}`, {
      ...options,
      headers: headers({ ...(options.body ? jsonHeaders : {}), ...(options.headers || {}) })
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(authError(data));
    return data;
  }

  const auth = {
    setSession(session) {
      accessToken = session?.access_token || null;
      return session || null;
    },
    getStoredSession() {
      try { return JSON.parse(storage?.getItem("pomaAcademy.account.session.v1") || "null"); } catch { return null; }
    },
    persistSession(session) {
      auth.setSession(session);
      if (session) storage?.setItem("pomaAcademy.account.session.v1", JSON.stringify(session));
      else storage?.removeItem("pomaAcademy.account.session.v1");
      return session;
    },
    async signUp({ email, password, options = {} }) {
      const data = await request("/auth/v1/signup", { method: "POST", body: JSON.stringify({ email, password, data: options.data || {} }) });
      return { data: { user: data.user || data, session: auth.persistSession(data.session || null) }, error: null };
    },
    async signInWithPassword({ email, password }) {
      const data = await request("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password }) });
      return { data: { user: data.user, session: auth.persistSession(data) }, error: null };
    },
    async getSession() {
      const session = auth.getStoredSession();
      if (!session?.access_token) return { data: { session: null }, error: null };
      auth.setSession(session);
      return { data: { session }, error: null };
    },
    async getUser() {
      const session = auth.getStoredSession();
      if (!session?.access_token) return { data: { user: null }, error: null };
      auth.setSession(session);
      const user = await request("/auth/v1/user");
      return { data: { user }, error: null };
    },
    async signOut() {
      try { await request("/auth/v1/logout", { method: "POST" }); } catch {}
      auth.persistSession(null);
      return { error: null };
    }
  };

  function from(table) {
    const query = { select: "*", filters: [], orderBy: null, limitValue: null, singleMode: false };
    const api = {
      select(columns = "*") { query.select = columns; return api; },
      eq(column, value) { query.filters.push(`${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}`); return api; },
      gt(column, value) { query.filters.push(`${encodeURIComponent(column)}=gt.${encodeURIComponent(value)}`); return api; },
      in(column, values = []) {
        const list = Array.from(values).map(value => encodeURIComponent(value)).join(",");
        query.filters.push(`${encodeURIComponent(column)}=in.(${list})`);
        return api;
      },
      order(column, opts = {}) { query.orderBy = `${column}.${opts.ascending === false ? "desc" : "asc"}`; return api; },
      limit(n) { query.limitValue = n; return api; },
      single() { query.singleMode = true; return api._run("GET"); },
      maybeSingle() { query.singleMode = true; return api._run("GET", true); },
      insert(payload) { return api._run("POST", false, payload); },
      update(payload) { return api._run("PATCH", false, payload); },
      delete() { return api._run("DELETE"); },
      then(resolve, reject) { return api._run("GET").then(resolve, reject); },
      async _run(method, maybe = false, payload) {
        const params = [`select=${encodeURIComponent(query.select)}`, ...query.filters];
        if (query.orderBy) params.push(`order=${encodeURIComponent(query.orderBy)}`);
        if (query.limitValue) params.push(`limit=${query.limitValue}`);
        const prefer = query.singleMode ? "application/vnd.pgrst.object+json" : "application/json";
        try {
          const data = await request(`/rest/v1/${table}?${params.join("&")}`, {
            method,
            headers: { Accept: prefer, Prefer: method === "POST" ? "return=representation" : "return=representation" },
            body: payload ? JSON.stringify(payload) : undefined
          });
          return { data, error: null };
        } catch (error) {
          if (maybe && /JSON object requested|406/.test(error.message)) return { data: null, error: null };
          return { data: null, error };
        }
      }
    };
    return api;
  }

  async function rpc(name, args = {}) {
    try {
      const data = await request(`/rest/v1/rpc/${name}`, { method: "POST", body: JSON.stringify(args) });
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  const storageApi = {
    from(bucket) {
      return {
        async upload(path, file, options = {}) {
          try {
            const data = await request(`/storage/v1/object/${encodeURIComponent(bucket)}/${path.split("/").map(encodeURIComponent).join("/")}`, {
              method: "POST",
              headers: { "Content-Type": options.contentType || file?.type || "application/octet-stream", "x-upsert": "false" },
              body: file
            });
            return { data, error: null };
          } catch (error) { return { data: null, error }; }
        },
        async createSignedUrl(path, expiresIn = 300) {
          try {
            const data = await request(`/storage/v1/object/sign/${encodeURIComponent(bucket)}/${path.split("/").map(encodeURIComponent).join("/")}`, {
              method: "POST", body: JSON.stringify({ expiresIn })
            });
            return { data: { signedUrl: data?.signedURL || data?.signedUrl }, error: null };
          } catch (error) { return { data: null, error }; }
        }
      };
    }
  };

  return {
    config,
    options: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    auth,
    from,
    rpc,
    storage: storageApi
  };
}

export function getSupabaseClient() {
  singleton ||= createPomaSupabaseClient();
  return singleton;
}

export { authError as translateSupabaseError };
