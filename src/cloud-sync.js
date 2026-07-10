(() => {
  "use strict";

  const cfg = window.DCW_GROWS_CONFIG || {};
  const APP_ID = cfg.appId || "dcw-grows";
  const API_BASE = String(cfg.apiBase || "").replace(/\/+$/, "");
  const DATA_KEY = `dcw.cloud.${APP_ID}.data.v1`;
  const SETTINGS_KEY = `dcw.cloud.${APP_ID}.settings.v1`;
  const DEVICE_KEY = `dcw.cloud.${APP_ID}.device.v1`;
  const BACKUP_KEY = `dcw.cloud.${APP_ID}.conflictBackup.v1`;

  let data = null;
  let revision = 0;
  let listeners = new Set();
  let saveTimer = null;
  let pollTimer = null;
  let busy = false;
  let hydrated = false;

  const emptyData = () => ({
    packedOrders: {},
    orderNotes: {},
    meta: {
      schema: "dcw-grows-cloud-v1",
      updatedAt: new Date().toISOString()
    }
  });

  function uid() {
    try { return crypto.randomUUID(); }
    catch { return `device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`; }
  }

  function deviceId() {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = uid();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  }

  function settings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"); }
    catch { return {}; }
  }

  function apiKey() {
    return String(settings().apiKey || "");
  }

  function setSettings(next) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      ...settings(),
      ...next,
      updatedAt: new Date().toISOString()
    }));
  }

  function status(state, message, detail = "") {
    window.dispatchEvent(new CustomEvent("dcw:sync-status", {
      detail: { state, message, detail, at: new Date().toISOString() }
    }));
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function notify(source = "local") {
    listeners.forEach(fn => {
      try { fn(data, { source, revision }); }
      catch (error) { console.error("DCW sync listener failed", error); }
    });

    window.dispatchEvent(new CustomEvent("dcw:data", {
      detail: { data, source, revision }
    }));
  }

  function parseLocal() {
    try {
      const cached = JSON.parse(localStorage.getItem(DATA_KEY) || "null");
      if (cached && cached.data) {
        revision = Number(cached.revision || 0);
        return cached.data;
      }
    } catch {}
    return null;
  }

  function persistLocal(next, source = "local") {
    data = next;
    localStorage.setItem(DATA_KEY, JSON.stringify({
      data,
      revision,
      savedAt: new Date().toISOString(),
      source
    }));
  }

  async function request(path, options = {}) {
    if (!API_BASE) throw new Error("Cloudflare API URL is missing.");
    if (!apiKey()) throw new Error("Sync key has not been saved on this device.");

    const response = await fetch(`${API_BASE}${path}`, {
      cache: "no-store",
      ...options,
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey(),
        ...(options.headers || {})
      }
    });

    let body = null;
    try { body = await response.json(); } catch {}

    if (response.status === 401) throw new Error("The sync key is incorrect.");

    if (response.status === 409) {
      const error = new Error("Cloud data changed on another device.");
      error.conflict = body;
      throw error;
    }

    if (!response.ok) {
      throw new Error(body?.error || body?.detail || `Cloud request failed (${response.status}).`);
    }

    return body;
  }

  async function pull({ force = false, silent = false } = {}) {
    if (!apiKey() || busy) return data;

    busy = true;
    if (!silent) status("syncing", "Checking Cloudflare…");

    try {
      const result = await request(`/v1/vault/${encodeURIComponent(APP_ID)}`, {
        method: "GET"
      });

      if (!result.exists) {
        if (!silent) status("empty", "Cloud vault is empty", "Connect once to upload this device.");
        return data;
      }

      const remoteRevision = Number(result.revision || 0);

      if (force || remoteRevision > revision) {
        revision = remoteRevision;
        data = result.data || emptyData();
        data.packedOrders ||= {};
        data.orderNotes ||= {};
        persistLocal(data, "cloud");
        notify("cloud");
      }

      status("synced", "Synced", `Cloud revision ${revision}`);
      return data;
    } catch (error) {
      status("offline", "Cloud unavailable", error.message);
      throw error;
    } finally {
      busy = false;
    }
  }

  async function push({ force = false } = {}) {
    if (!apiKey()) {
      status("setup", "Sync setup needed", "Enter the private sync key.");
      return null;
    }

    if (!data || busy) return null;

    busy = true;
    status("saving", "Saving to Cloudflare…");

    try {
      data.meta = {
        ...(data.meta || {}),
        schema: "dcw-grows-cloud-v1",
        updatedAt: new Date().toISOString(),
        updatedBy: deviceId()
      };

      persistLocal(data, "local");

      const result = await request(`/v1/vault/${encodeURIComponent(APP_ID)}`, {
        method: "PUT",
        body: JSON.stringify({
          expectedRevision: force ? undefined : revision,
          deviceId: deviceId(),
          data
        })
      });

      revision = Number(result.revision || revision + 1);
      persistLocal(data, "cloud");
      status("synced", "Saved & synced", `Cloud revision ${revision}`);
      notify("saved");
      return result;
    } catch (error) {
      if (error.conflict) {
        localStorage.setItem(BACKUP_KEY, JSON.stringify({
          savedAt: new Date().toISOString(),
          revision,
          data: clone(data)
        }));

        status("conflict", "Newer cloud version found", "Local changes were backed up.");
        await pull({ force: true, silent: true });
      } else {
        status("offline", "Saved on this device", error.message);
      }

      throw error;
    } finally {
      busy = false;
    }
  }

  function schedulePush(delay = 700) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => push().catch(console.warn), delay);
  }

  function update(next, { autosave = true, source = "local" } = {}) {
    data = typeof next === "function" ? next(clone(data || emptyData())) : next;
    if (!data) return;

    data.packedOrders ||= {};
    data.orderNotes ||= {};
    data.meta = {
      ...(data.meta || {}),
      schema: "dcw-grows-cloud-v1",
      updatedAt: new Date().toISOString(),
      updatedBy: deviceId()
    };

    persistLocal(data, source);
    notify(source);

    if (autosave) schedulePush();
  }

  async function connect(key) {
    const clean = String(key || "").trim();
    if (!clean) throw new Error("Enter the private sync key.");

    setSettings({ apiKey: clean });
    status("syncing", "Connecting to Cloudflare…");

    const remote = await request(`/v1/vault/${encodeURIComponent(APP_ID)}`, {
      method: "GET"
    });

    if (remote.exists) {
      revision = Number(remote.revision || 0);
      data = remote.data || emptyData();
      data.packedOrders ||= {};
      data.orderNotes ||= {};
      persistLocal(data, "cloud");
      notify("cloud");
      status("synced", "Connected & synced", `Cloud revision ${revision}`);
    } else {
      data ||= emptyData();
      revision = 0;
      await push();
    }

    startPolling();
    return data;
  }

  function pairingUrl() {
    if (!apiKey()) return "";

    const url = new URL(location.href);
    url.search = "";
    url.hash = `syncKey=${encodeURIComponent(apiKey())}`;
    return url.toString();
  }

  async function importPairingKey() {
    const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(location.search);
    const key = hash.get("syncKey") || query.get("syncKey");

    if (!key) return false;

    setSettings({ apiKey: key.trim() });
    history.replaceState(null, "", location.pathname);
    return true;
  }

  async function init() {
    await importPairingKey();

    data = parseLocal() || emptyData();
    data.packedOrders ||= {};
    data.orderNotes ||= {};
    persistLocal(data, "seed");
    notify("seed");

    if (apiKey()) {
      try {
        const remote = await request(`/v1/vault/${encodeURIComponent(APP_ID)}`, {
          method: "GET"
        });

        if (remote.exists) {
          revision = Number(remote.revision || 0);
          data = remote.data || emptyData();
          data.packedOrders ||= {};
          data.orderNotes ||= {};
          persistLocal(data, "cloud");
          notify("cloud");
          status("synced", "Synced", `Cloud revision ${revision}`);
        } else {
          revision = 0;
          await push();
        }
      } catch (error) {
        status("offline", "Offline cache active", error.message);
      }
    } else {
      status("setup", "Cloud sync not connected", "Enter the private sync key.");
    }

    hydrated = true;
    startPolling();
    return data;
  }

  function startPolling() {
    clearInterval(pollTimer);
    if (!apiKey()) return;

    const ms = Math.max(30000, Number(cfg.pollMs || 60000));

    pollTimer = setInterval(() => {
      if (document.visibilityState === "visible") {
        pull({ silent: true }).catch(() => {});
      }
    }, ms);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && hydrated && apiKey()) {
      pull({ silent: true }).catch(() => {});
    }
  });

  window.addEventListener("online", () => {
    if (hydrated && apiKey()) pull({ silent: true }).catch(() => {});
  });

  window.DCWCloud = {
    init,
    connect,
    pull,
    push,
    update,
    schedulePush,
    getData: () => data,
    getRevision: () => revision,
    getApiKey: apiKey,
    pairingUrl,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    clearKey() {
      setSettings({ apiKey: "" });
      status("setup", "Sync disconnected", "Local cache remains on this device.");
    }
  };
})();
