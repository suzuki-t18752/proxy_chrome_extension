document.addEventListener("DOMContentLoaded", () => {
  const proxyListContainer = document.getElementById("proxyListContainer");
  const toggleButton = document.getElementById("toggleProxy");
  const saveButton = document.getElementById("saveProxy");
  const deleteButton = document.getElementById("deleteProxy");
  const proxyStatus = document.getElementById("proxyStatus");
  const toggleNewProxyButton = document.getElementById("toggleNewProxy");
  const newProxyForm = document.getElementById("newProxyForm");

  const proxyNameInput = document.getElementById("proxyName");
  const schemeInput = document.getElementById("scheme");
  const hostInput = document.getElementById("host");
  const portInput = document.getElementById("port");
  const bypassInput = document.getElementById("bypassList");

  const MAX_PROXIES = 5;

  function createProxyItem(proxyName, proxyConfig, isActive) {
      const item = document.createElement("div");
      item.className = `proxy-item ${isActive ? "active" : ""}`;
      item.innerHTML = `
          <div class="proxy-item-info">
              <div class="proxy-item-name">${proxyName}</div>
              <div class="proxy-item-details">${proxyConfig.host}:${proxyConfig.port}</div>
          </div>
          <div class="proxy-item-actions">
              <button class="btn apply" data-name="${proxyName}">適用</button>
              <button class="btn delete" data-name="${proxyName}">削除</button>
          </div>
      `;
      return item;
  }

  function updateProxyList(proxies, selectedProxy) {
      proxyListContainer.innerHTML = "";
      Object.entries(proxies).forEach(([name, config]) => {
          const item = createProxyItem(name, config, name === selectedProxy);
          proxyListContainer.appendChild(item);
      });

      // イベントリスナーを設定
      proxyListContainer.querySelectorAll(".btn.apply").forEach(button => {
          button.addEventListener("click", () => {
              const proxyName = button.dataset.name;
              chrome.storage.local.set({ selectedProxy: proxyName }, () => {
                  chrome.runtime.sendMessage({ action: "applyProxy" });
                  loadProxies();
                  alert("プロキシ設定を読み込みました！");
              });
          });
      });

      proxyListContainer.querySelectorAll(".btn.delete").forEach(button => {
          button.addEventListener("click", () => {
              const proxyName = button.dataset.name;
              chrome.storage.local.get("proxies", (result) => {
                  const proxies = result.proxies || {};
                  delete proxies[proxyName];
                  chrome.storage.local.set({ proxies }, () => {
                      loadProxies();
                      alert("プロキシ設定を削除しました！");
                  });
              });
          });
      });
  }

  function updateProxyStatus(enabled) {
      proxyStatus.textContent = enabled ? "有効" : "無効";
      proxyStatus.className = "status-text " + (enabled ? "enabled" : "disabled");
  }

  function loadProxies() {
      chrome.storage.local.get(["proxies", "selectedProxy", "proxyEnabled"], (result) => {
          const proxies = result.proxies || {};
          const selectedProxy = result.selectedProxy || null;
          const proxyEnabled = result.proxyEnabled || false;

          updateProxyList(proxies, selectedProxy);
          toggleButton.textContent = proxyEnabled ? "プロキシOFF" : "プロキシON";
          updateProxyStatus(proxyEnabled);
      });
  }

  // 新しいプロキシ設定フォームの表示/非表示を切り替え
  toggleNewProxyButton.addEventListener("click", () => {
      const isVisible = newProxyForm.style.display === "block";
      newProxyForm.style.display = isVisible ? "none" : "block";
      toggleNewProxyButton.textContent = isVisible ? "新しいプロキシ設定を追加" : "フォームを閉じる";
  });

  // フォームをリセットする関数
  function resetForm() {
      proxyNameInput.value = "";
      schemeInput.value = "";
      hostInput.value = "";
      portInput.value = "";
      bypassInput.value = "";
  }

  // 保存ボタンを押した時にフォームを閉じる
  saveButton.addEventListener("click", () => {
      const name = proxyNameInput.value.trim();
      if (!name) return alert("名前を入力してください！");

      chrome.storage.local.get("proxies", (result) => {
          const proxies = result.proxies || {};
          if (Object.keys(proxies).length >= MAX_PROXIES) {
              return alert(`プロキシ設定は最大${MAX_PROXIES}つまでです！`);
          }

          const proxyConfig = {
              scheme: schemeInput.value,
              host: hostInput.value,
              port: parseInt(portInput.value, 10) || 8080,
              bypassList: bypassInput.value.split(",").map(item => item.trim())
          };

          proxies[name] = proxyConfig;
          chrome.storage.local.set({ proxies }, () => {
              loadProxies();
              resetForm();
              newProxyForm.style.display = "none";
              toggleNewProxyButton.textContent = "新しいプロキシ設定を追加";
              alert("プロキシ設定を保存しました！");
          });
      });
  });

  toggleButton.addEventListener("click", () => {
      chrome.runtime.sendMessage({ action: "toggleProxy" }, (response) => {
          if (response && response.proxyEnabled !== undefined) {
              toggleButton.textContent = response.proxyEnabled ? "プロキシOFF" : "プロキシON";
              updateProxyStatus(response.proxyEnabled);
              loadProxies(); // プロキシ設定の表示を更新
          }
      });
  });

  loadProxies();
});
