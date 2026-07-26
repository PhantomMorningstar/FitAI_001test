(() => {
  'use strict';

  const installButton = document.getElementById('install-app-btn');
  const connectionBanner = document.getElementById('connection-banner');
  let installPrompt = null;

  function updateConnectionState() {
    const offline = !navigator.onLine;
    document.documentElement.classList.toggle('is-offline', offline);
    if (connectionBanner) connectionBanner.hidden = !offline;
  }

  window.addEventListener('online', updateConnectionState);
  window.addEventListener('offline', updateConnectionState);
  updateConnectionState();

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    if (installButton) installButton.hidden = false;
  });

  installButton?.addEventListener('click', async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    installButton.hidden = true;
  });

  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    if (installButton) installButton.hidden = true;
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
        .catch(() => {
          if (connectionBanner) {
            connectionBanner.textContent = 'Không thể bật chế độ ngoại tuyến trên trình duyệt này.';
            connectionBanner.hidden = false;
          }
        });
    });
  }
})();
