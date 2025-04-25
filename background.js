chrome.runtime.onInstalled.addListener(() => {
  // プロキシを無効にし、設定をクリア
  chrome.proxy.settings.clear({});

  // ストレージを初期化
  chrome.storage.local.set({
    proxies: {},
    proxyEnabled: false,
    selectedProxy: null
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
              sendResponse({ proxyEnabled: newState });
          });
      });
      return true;
  }
});
