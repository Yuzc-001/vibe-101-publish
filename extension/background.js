const STORAGE_KEY = 'vibe_publish_extension_payload';
const TARGETS = {
  local: 'http://127.0.0.1:5173/',
  prod: 'https://yuzc-001.github.io/vibe-101-publish/'
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'send-selection-to-vibe',
    title: '发送到 vibe-101-publish',
    contexts: ['selection']
  });
});

async function openWorkspace(payload, preferredTarget = 'prod') {
  await chrome.storage.local.set({ [STORAGE_KEY]: { ...payload, createdAt: Date.now() } });
  const target = TARGETS[preferredTarget] || TARGETS.prod;
  await chrome.tabs.create({ url: `${target}?source=chrome-extension` });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'send-selection-to-vibe') return;
  const payload = {
    mode: 'selection',
    title: tab?.title || '',
    url: tab?.url || '',
    content: info.selectionText || ''
  };
  await openWorkspace(payload, 'prod');
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'OPEN_WORKSPACE') {
    openWorkspace(message.payload, message.target || 'prod')
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }
  if (message?.type === 'GET_TARGETS') {
    sendResponse({ ok: true, targets: TARGETS });
  }
});
