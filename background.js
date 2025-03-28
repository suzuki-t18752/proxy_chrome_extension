chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["proxies", "proxyEnabled"], (result) => {
      if (!result.proxies) {
          chrome.storage.local.set({ proxies: {} });
      }
      if (result.proxyEnabled === undefined) {
          chrome.storage.local.set({ proxyEnabled: false });
      }
  });
});

function applyProxy() {
  chrome.storage.local.get(["selectedProxy", "proxies"], (result) => {
      const proxy = result.proxies?.[result.selectedProxy];
      if (!proxy) return;

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
              newState ? applyProxy() : chrome.proxy.settings.clear({});
              sendResponse({ proxyEnabled: newState });
          });
      });
      return true;
  }
});
