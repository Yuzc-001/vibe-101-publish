function getSelectionText() {
  const selection = window.getSelection();
  return selection ? normalizeText(selection.toString()) : '';
}

function normalizeText(text) {
  return (text || '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function getPageText() {
  const article = document.querySelector('article');
  const main = document.querySelector('main');
  const bodyText = (article || main || document.body)?.innerText || '';
  return normalizeText(bodyText).slice(0, 20000);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'EXTRACT_PAGE') {
    sendResponse({
      ok: true,
      payload: {
        mode: 'page',
        title: document.title,
        url: location.href,
        selection: getSelectionText(),
        content: getSelectionText() || getPageText()
      }
    });
  }
});
