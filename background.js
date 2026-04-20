function createIconImageData(bgColor, size) {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // 角丸の背景
  const radius = Math.max(2, size * 0.2);
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();

  // 中央に白い "P" (Proxy)
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.floor(size * 0.72)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("P", size / 2, size / 2 + size * 0.04);

  return ctx.getImageData(0, 0, size, size);
}

function updateActionBadge(enabled) {
  const bgColor = enabled ? "#4fc3f7" : "#9e9e9e";
  chrome.action.setIcon({
    imageData: {
      16: createIconImageData(bgColor, 16),
      32: createIconImageData(bgColor, 32),
      48: createIconImageData(bgColor, 48),
      128: createIconImageData(bgColor, 128)
    }
  });
  chrome.action.setTitle({ title: enabled ? "プロキシ: 有効" : "プロキシ: 無効" });
}

chrome.runtime.onInstalled.addListener(() => {
  // 既存の設定を読み込み、未設定のキーのみ初期値を入れる
  chrome.storage.local.get(["proxies", "proxyEnabled", "selectedProxy"], (result) => {
    const defaults = {};
    if (result.proxies === undefined) defaults.proxies = {};
    if (result.proxyEnabled === undefined) defaults.proxyEnabled = false;
    if (result.selectedProxy === undefined) defaults.selectedProxy = null;

    if (Object.keys(defaults).length > 0) {
      chrome.storage.local.set(defaults);
    }

    // 保存済みの状態に従ってプロキシを復元
    if (result.proxyEnabled) {
      applyProxy();
    } else {
      chrome.proxy.settings.clear({});
    }
    updateActionBadge(!!result.proxyEnabled);
  });
});

// ブラウザ起動時にも保存済みのプロキシ設定を復元
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(["proxyEnabled"], (result) => {
    if (result.proxyEnabled) {
      applyProxy();
    }
    updateActionBadge(!!result.proxyEnabled);
  });
});

function applyProxy() {
  chrome.storage.local.get(["selectedProxy", "proxies", "proxyEnabled"], (result) => {
      const proxy = result.proxies?.[result.selectedProxy];
      if (!proxy) return;

      // プロキシ設定を常に適用
      chrome.proxy.settings.set({
          value: {
              mode: "fixed_servers",
              rules: {
                  singleProxy: {
                      scheme: proxy.scheme,
                      host: proxy.host,
                      port: proxy.port
                  },
                  bypassList: proxy.bypassList || ["<local>"]
              }
          },
          scope: "regular"
      }, () => console.log("Proxy Applied"));
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "applyProxy") {
      applyProxy();
  } else if (message.action === "toggleProxy") {
      chrome.storage.local.get(["proxyEnabled"], (result) => {
          let newState = !result.proxyEnabled;
          chrome.storage.local.set({ proxyEnabled: newState }, () => {
              if (newState) {
                  applyProxy();
              } else {
                  chrome.proxy.settings.clear({});
              }
              updateActionBadge(newState);
              sendResponse({ proxyEnabled: newState });
          });
      });
      return true;
  }
});
