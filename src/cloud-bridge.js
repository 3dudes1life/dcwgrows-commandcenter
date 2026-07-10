(() => {
  "use strict";

  const LEGACY_PACKED_KEY = "dcwPackedOrders";

  function legacyPackedMap() {
    try { return JSON.parse(localStorage.getItem(LEGACY_PACKED_KEY) || "{}"); }
    catch { return {}; }
  }

  function cloudPackedMap() {
    const records = window.DCWCloud?.getData()?.packedOrders || {};
    const map = {};

    Object.entries(records).forEach(([orderId, record]) => {
      if (record === true || record?.packed) map[orderId] = true;
    });

    return map;
  }

  window.getPackedMap = function getPackedMap() {
    return {
      ...legacyPackedMap(),
      ...cloudPackedMap()
    };
  };

  window.savePackedMap = function savePackedMap(map) {
    localStorage.setItem(LEGACY_PACKED_KEY, JSON.stringify(map || {}));

    if (!window.DCWCloud) return;

    window.DCWCloud.update(current => {
      current ||= {};
      current.packedOrders ||= {};

      const nextRecords = {};

      Object.keys(map || {}).forEach(orderId => {
        if (map[orderId]) {
          nextRecords[orderId] = current.packedOrders[orderId] || {
            packed: true,
            packedAt: new Date().toISOString()
          };
        }
      });

      current.packedOrders = nextRecords;
      return current;
    });
  };

  window.markOrderPacked = function markOrderPacked(orderId) {
    const map = window.getPackedMap();
    map[orderId] = true;

    localStorage.setItem(LEGACY_PACKED_KEY, JSON.stringify(map));

    window.DCWCloud?.update(current => {
      current ||= {};
      current.packedOrders ||= {};
      current.packedOrders[orderId] = {
        packed: true,
        packedAt: new Date().toISOString()
      };
      return current;
    });

    window.renderAll?.();
  };

  window.unmarkOrderPacked = function unmarkOrderPacked(orderId) {
    const map = window.getPackedMap();
    delete map[orderId];

    localStorage.setItem(LEGACY_PACKED_KEY, JSON.stringify(map));

    window.DCWCloud?.update(current => {
      current ||= {};
      current.packedOrders ||= {};
      delete current.packedOrders[orderId];
      return current;
    });

    window.renderAll?.();
  };

  function paintStatus(detail = {}) {
    const pill = document.querySelector("#cloudSyncPill");
    const detailEl = document.querySelector("#cloudSyncDetail");

    if (pill) {
      pill.className = `sync-pill ${detail.state || ""}`;
      pill.textContent = detail.message || "Cloud sync";
    }

    if (detailEl) {
      detailEl.textContent = detail.detail || (
        window.DCWCloud?.getApiKey()
          ? `Cloud revision ${window.DCWCloud.getRevision()}`
          : "Connect each device once."
      );
    }
  }

  async function connectCloud() {
    const input = document.querySelector("#cloudSyncKey");
    const key = input?.value.trim();

    if (!key) {
      alert("Enter the same private sync key used by your other dashboards.");
      return;
    }

    try {
      await window.DCWCloud.connect(key);
      if (input) input.value = "";
      window.renderAll?.();
    } catch (error) {
      alert(error.message);
    }
  }

  async function pullCloud() {
    try {
      await window.DCWCloud.pull({ force: true });
      window.renderAll?.();
    } catch (error) {
      alert(error.message);
    }
  }

  async function copyPairLink() {
    const link = window.DCWCloud.pairingUrl();

    if (!link) {
      alert("Connect this device first.");
      return;
    }

    try {
      await navigator.clipboard.writeText(link);
      paintStatus({
        state: "synced",
        message: "Pair link copied",
        detail: "Open it on another device."
      });
    } catch {
      prompt("Copy this private pairing link:", link);
    }
  }

  function bindCloudControls() {
    document.querySelector("#connectCloudButton")?.addEventListener("click", connectCloud);
    document.querySelector("#pullCloudButton")?.addEventListener("click", pullCloud);
    document.querySelector("#copyPairButton")?.addEventListener("click", copyPairLink);
  }

  window.addEventListener("dcw:sync-status", event => paintStatus(event.detail));

  (async () => {
    bindCloudControls();

    const legacy = legacyPackedMap();
    const cloud = await window.DCWCloud.init();

    if (Object.keys(legacy).length && !Object.keys(cloud.packedOrders || {}).length) {
      window.DCWCloud.update(current => {
        current.packedOrders ||= {};

        Object.keys(legacy).forEach(orderId => {
          if (legacy[orderId]) {
            current.packedOrders[orderId] = {
              packed: true,
              packedAt: new Date().toISOString(),
              migratedFrom: "localStorage"
            };
          }
        });

        return current;
      });
    }

    window.DCWCloud.subscribe((next, meta) => {
      if (meta.source === "cloud") window.renderAll?.();
    });

    paintStatus({
      state: window.DCWCloud.getApiKey() ? "synced" : "setup",
      message: window.DCWCloud.getApiKey() ? "Cloud connected" : "Connect cloud",
      detail: window.DCWCloud.getApiKey()
        ? `Cloud revision ${window.DCWCloud.getRevision()}`
        : "Enter the private sync key once."
    });

    window.renderAll?.();
  })();
})();
