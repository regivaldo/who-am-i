chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        updateBadge(tabId, tab.url);
    }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url) {
        updateBadge(activeInfo.tabId, tab.url);
    }
});

async function updateBadge(tabId, url) {
    if (!url) return;

    // Default state
    chrome.action.setBadgeText({ text: "", tabId });

    if (url.startsWith('chrome://') || url.startsWith('edge://')) return;

    const data = await chrome.storage.sync.get('environments');
    const environments = data.environments || [];

    let match = null;
    for (const env of environments) {
        try {
            if (env.urlPattern.startsWith('/') && env.urlPattern.endsWith('/')) {
                const regex = new RegExp(env.urlPattern.slice(1, -1));
                if (regex.test(url)) match = env;
            } else {
                if (url.includes(env.urlPattern)) match = env;
            }
        } catch (e) {
            console.error("Invalid regex in background", env.urlPattern);
        }
        if (match) break;
    }

    if (match) {
        // Set badge background color only (no text)
        chrome.action.setBadgeBackgroundColor({ color: match.color, tabId });
    }
}
