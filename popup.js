document.addEventListener("DOMContentLoaded", () => {
  const proxyList = document.getElementById("proxyList");
  const applyButton = document.getElementById("applyProxy");
  const toggleButton = document.getElementById("toggleProxy");
  const saveButton = document.getElementById("saveProxy");
  const deleteButton = document.getElementById("deleteProxy");

  const proxyNameInput = document.getElementById("proxyName");
  const schemeInput = document.getElementById("scheme");
  const hostInput = document.getElementById("host");
  const portInput = document.getElementById("port");
  const bypassInput = document.getElementById("bypassList");

  function loadProxies() {
      chrome.storage.local.get(["proxies", "selectedProxy", "proxyEnabled"], (result) => {
          proxyList.innerHTML = "";
          const proxies = result.proxies || {};
          const selectedProxy = result.selectedProxy || null;

          for (const name in proxies) {
              const option = document.createElement("option");
              option.value = name;
              option.textContent = name;
              if (name === selectedProxy) option.selected = true;
              proxyList.appendChild(option);
          }

          toggleButton.textContent = result.proxyEnabled ? "プロキシOFF" : "プロキシON";
      });
  }

  proxyList.addEventListener("change", () => {
      const selected = proxyList.value;
      chrome.storage.local.get("proxies", (result) => {
          if (result.proxies && result.proxies[selected]) {
              const proxy = result.proxies[selected];
              proxyNameInput.value = selected;
              schemeInput.value = proxy.scheme;
              hostInput.value = proxy.host;
              portInput.value = proxy.port;
              bypassInput.value = proxy.bypassList.join(", ");
          }
      });
  });

  saveButton.addEventListener("click", () => {
      const name = proxyNameInput.value.trim();
      if (!name) return alert("名前を入力してください！");

      const proxyConfig = {
          scheme: schemeInput.value,
          host: hostInput.value,
          port: parseInt(portInput.value, 10) || 8080,
          bypassList: bypassInput.value.split(",").map(item => item.trim())
      };

      chrome.storage.local.get("proxies", (result) => {
          const proxies = result.proxies || {};
          proxies[name] = proxyConfig;
          chrome.storage.local.set({ proxies }, () => {
              loadProxies();
              alert("プロキシ設定を保存しました！");
          });
      });
  });

  deleteButton.addEventListener("click", () => {
      const selected = proxyList.value;
      if (!selected) return alert("削除するプロキシを選択してください！");

      chrome.storage.local.get("proxies", (result) => {
          const proxies = result.proxies || {};
          delete proxies[selected];
          chrome.storage.local.set({ proxies }, () => {
              loadProxies();
              alert("プロキシ設定を削除しました！");
          });
      });
  });

  applyButton.addEventListener("click", () => {
      const selected = proxyList.value;
      if (!selected) return alert("適用するプロキシを選択してください！");

      chrome.storage.local.set({ selectedProxy: selected }, () => {
          chrome.runtime.sendMessage({ action: "applyProxy" });
          alert("プロキシを適用しました！");
      });
  });

  toggleButton.addEventListener("click", () => {
      chrome.runtime.sendMessage({ action: "toggleProxy" }, (response) => {
          toggleButton.textContent = response.proxyEnabled ? "プロキシOFF" : "プロキシON";
      });
  });

  loadProxies();
});
