document.addEventListener('DOMContentLoaded', async () => {
    // View mode elements
    const viewMode = document.getElementById('view-mode');
    const unknownState = document.getElementById('unknown-state');
    const envName = document.getElementById('env-name');
    const colorBar = document.getElementById('color-bar');
    const indicationType = document.getElementById('indication-type');
    const borderWidthEl = document.getElementById('border-width');
    const editBtn = document.getElementById('edit-btn');
    const registerBtn = document.getElementById('register-btn');

    // Edit mode elements
    const editMode = document.getElementById('edit-mode');
    const editUrl = document.getElementById('edit-url');
    const editName = document.getElementById('edit-name');
    const editIndication = document.getElementById('edit-indication');
    const editBorderWidth = document.getElementById('edit-border-width');
    const editColor = document.getElementById('edit-color');
    const editColorBar = document.getElementById('edit-color-bar');
    const cancelBtn = document.getElementById('cancel-btn');
    const saveBtn = document.getElementById('save-btn');

    let currentMatch = null;
    let currentHostname = '';
    let currentTab = null;

    // Helper functions
    const formatIndicationType = (type) => {
        const types = {
            'borda-completa': 'Borda Completa',
            'somente-topo': 'Somente topo',
            'balao': 'Balão'
        };
        return types[type] || type || 'Borda Completa';
    };

    const formatBorderWidth = (width) => {
        if (!width) return '5 px';
        return width.replace('px', ' px');
    };

    const showViewMode = () => {
        viewMode.classList.remove('hidden');
        editMode.classList.add('hidden');
    };

    const showEditMode = () => {
        viewMode.classList.add('hidden');
        editMode.classList.remove('hidden');

        // Populate edit fields
        if (currentMatch) {
            editUrl.value = currentMatch.urlPattern || currentHostname;
            editName.value = currentMatch.name || '';
            editIndication.value = currentMatch.indicationType || 'borda-completa';
            editBorderWidth.value = currentMatch.borderWidth || '5px';
            editColor.value = currentMatch.color || '#b91c1c';
            editColorBar.style.backgroundColor = currentMatch.color || '#b91c1c';
        } else {
            editUrl.value = currentHostname;
            editName.value = '';
            editIndication.value = 'borda-completa';
            editBorderWidth.value = '5px';
            editColor.value = '#b91c1c';
            editColorBar.style.backgroundColor = '#b91c1c';
        }
    };

    const showUnknownState = () => {
        const contentDiv = viewMode.querySelector('.popup-content');
        if (contentDiv) contentDiv.classList.add('hidden');
        unknownState.classList.remove('hidden');
    };

    const showKnownState = () => {
        const contentDiv = viewMode.querySelector('.popup-content');
        if (contentDiv) contentDiv.classList.remove('hidden');
        unknownState.classList.add('hidden');
    };

    // Update color bar in edit mode when color picker changes
    editColor.addEventListener('input', (e) => {
        editColorBar.style.backgroundColor = e.target.value;
    });

    // Edit button click
    editBtn.addEventListener('click', () => {
        showEditMode();
    });

    // Register button click (for unknown environments)
    registerBtn.addEventListener('click', () => {
        showEditMode();
    });

    // Cancel button click
    cancelBtn.addEventListener('click', () => {
        showViewMode();
    });

    // Save button click
    saveBtn.addEventListener('click', async () => {
        const urlPattern = editUrl.value.trim();
        const name = editName.value.trim();
        const indication = editIndication.value;
        const borderWidth = editBorderWidth.value.trim() || '5px';
        const color = editColor.value;

        if (!urlPattern || !name) {
            alert('Por favor, preencha URL e Nome do Ambiente');
            return;
        }

        const data = await chrome.storage.sync.get('environments');
        let environments = data.environments || [];

        // Check if we're editing an existing environment
        const existingIndex = environments.findIndex(env =>
            env.urlPattern === currentMatch?.urlPattern
        );

        const newEnv = {
            urlPattern,
            name,
            indicationType: indication,
            borderWidth,
            color
        };

        if (existingIndex >= 0) {
            environments[existingIndex] = newEnv;
        } else {
            environments.push(newEnv);
        }

        await chrome.storage.sync.set({ environments });

        // Update current match and refresh view
        currentMatch = newEnv;
        updateViewWithMatch(newEnv);
        showKnownState();
        showViewMode();
    });

    const updateViewWithMatch = (match) => {
        envName.textContent = match.name;
        colorBar.style.backgroundColor = match.color;
        indicationType.textContent = formatIndicationType(match.indicationType);
        borderWidthEl.textContent = formatBorderWidth(match.borderWidth);
    };

    // Load current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;

    if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
        envName.textContent = "Página do Sistema";
        showViewMode();
        editBtn.style.display = 'none';
        return;
    }

    const urlObj = new URL(tab.url);
    currentHostname = urlObj.hostname;

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

    currentMatch = match;

    if (match) {
        updateViewWithMatch(match);
        showKnownState();
    } else {
        showUnknownState();
    }

    showViewMode();
});
