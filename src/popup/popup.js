document.addEventListener('DOMContentLoaded', async () => {
    const statusCard = document.getElementById('status-card');
    const envName = document.getElementById('env-name');
    const currentUrlEl = document.getElementById('current-url');
    const settingsBtn = document.getElementById('settings-btn');
    const addBtn = document.getElementById('add-current-btn');
    const statusIconDiv = document.querySelector('.status-icon');

    // Load current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
        envName.textContent = "Página do Sistema";
        currentUrlEl.textContent = "Não é possível identificar esta página";
        addBtn.disabled = true;
        addBtn.style.opacity = "0.5";
        addBtn.style.cursor = "not-allowed";
        return;
    }

    const urlObj = new URL(tab.url);
    const hostname = urlObj.hostname;
    currentUrlEl.textContent = hostname;

    // Load environments
    const data = await chrome.storage.sync.get('environments');
    const environments = data.environments || [];

    let match = null;
    // Simple check: match exact hostname or regex
    for (const env of environments) {
        try {
            if (env.urlPattern.startsWith('/') && env.urlPattern.endsWith('/')) {
                const regex = new RegExp(env.urlPattern.slice(1, -1));
                if (regex.test(tab.url)) match = env;
            } else {
                if (tab.url.includes(env.urlPattern)) match = env;
            }
        } catch (e) {
            console.error("Invalid regex", env.urlPattern);
        }
        if (match) break;
    }

    if (match) {
        envName.textContent = match.name;
        statusCard.style.borderTopColor = match.color;
        statusIconDiv.style.color = match.color;

        // Update icon to checkmark
        statusIconDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;

        addBtn.textContent = "Gerenciar Ambientes";
        addBtn.onclick = () => {
            chrome.runtime.openOptionsPage();
        };
    } else {
        envName.textContent = "Ambiente Desconhecido";
        statusIconDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;

        addBtn.textContent = "Registrar Este Site";
        addBtn.onclick = async () => {
            // Save temporary intent so options page can pick it up
            await chrome.storage.local.set({ 'adding_url': hostname });
            chrome.runtime.openOptionsPage();
        };
    }

    settingsBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
});
