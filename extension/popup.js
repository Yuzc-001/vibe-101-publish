async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function sendToWorkspace(mode) {
  const tab = await getActiveTab();
  const target = document.getElementById('target').value;
  const status = document.getElementById('status');

  if (!tab?.id) {
    status.textContent = '未找到当前标签页';
    return;
  }

  let res;
  try {
    res = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_PAGE' });
  } catch (error) {
    status.textContent = '当前页面暂不支持提取，请刷新页面后重试';
    return;
  }

  if (!res?.ok) {
    status.textContent = '页面内容提取失败';
    return;
  }

  if (!res.payload?.content) {
    status.textContent = '没有提取到有效内容';
    return;
  }

  const payload = {
    ...res.payload,
    mode,
    content: mode === 'selection' ? (res.payload.selection || res.payload.content) : res.payload.content
  };

  chrome.runtime.sendMessage({ type: 'OPEN_WORKSPACE', payload, target }, (reply) => {
    status.textContent = reply?.ok ? '已发送到工作台' : `发送失败: ${reply?.error || 'unknown'}`;
  });
}

getActiveTab().then((tab) => {
  document.getElementById('pageMeta').textContent = `${tab?.title || 'Untitled'}\n${tab?.url || ''}`;
});

document.getElementById('sendSelection').addEventListener('click', () => sendToWorkspace('selection'));
document.getElementById('sendPage').addEventListener('click', () => sendToWorkspace('page'));
document.getElementById('openWorkspaceOnly').addEventListener('click', async () => {
  const target = document.getElementById('target').value;
  chrome.runtime.sendMessage({
    type: 'OPEN_WORKSPACE',
    payload: { mode: 'empty', title: '', url: '', content: '' },
    target
  }, (reply) => {
    document.getElementById('status').textContent = reply?.ok ? '已打开工作台' : `打开失败: ${reply?.error || 'unknown'}`;
  });
});
