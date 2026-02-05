// Configurações básicas
const urlParams = new URLSearchParams(window.location.search);
const docId = urlParams.get('doc');

if (!docId) {
    alert('Nenhum documento especificado.');
    throw new Error('Doc ID missing');
}

const pdfjsLib = window['pdfjs-dist/build/pdf'] || window.pdfjsLib;
if (pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
}

const canvas = document.getElementById('pdf-canvas');
const ctx = canvas.getContext('2d');
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.2;

// --- AQUI ESTÁ A MUDANÇA PARA COOKIES ---
async function fetchPdfArrayBuffer(docId) {
  // Não precisamos de Headers manuais. 
  // O 'credentials: include' diz pro navegador: "Manda os cookies junto!"
  
  const resp = await fetch(`/api/pdf/${encodeURIComponent(docId)}`, { 
      method: 'GET',
      credentials: 'include' 
  });

  if (resp.status === 401 || resp.status === 403) {
      alert('Sessão expirada. Faça login novamente.');
      window.location.href = '/login.html';
      throw new Error('Não autorizado');
  }

  if (resp.status === 404) {
      alert('Documento não encontrado.');
      throw new Error('Not Found');
  }

  if (!resp.ok) throw new Error('Erro na API: ' + resp.status);

  return await resp.arrayBuffer();
}
// ----------------------------------------

function renderPage(num) {
  pageRendering = true;
  pdfDoc.getPage(num).then(function(page) {
    const viewport = page.getViewport({ scale: scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };

    const renderTask = page.render(renderContext);
    renderTask.promise.then(function() {
      pageRendering = false;
      if (pageNumPending !== null) {
        renderPage(pageNumPending);
        pageNumPending = null;
      }
    });
  });

  const pageNumSpan = document.getElementById('page_num');
  if (pageNumSpan) pageNumSpan.textContent = num;

  const btnPrev = document.getElementById('prev');
  const btnNext = document.getElementById('next');
  if (btnPrev) btnPrev.disabled = num <= 1;
  if (btnNext) btnNext.disabled = num >= pdfDoc.numPages;
}

function queueRenderPage(num) {
  if (pageRendering) {
    pageNumPending = num;
  } else {
    renderPage(num);
  }
}

function onPrevPage() {
  if (pageNum <= 1) return;
  pageNum--;
  queueRenderPage(pageNum);
}

function onNextPage() {
  if (pageNum >= pdfDoc.numPages) return;
  pageNum++;
  queueRenderPage(pageNum);
}

function onZoomIn() {
  scale = Math.min(scale + 0.25, 3);
  queueRenderPage(pageNum);
}

function onZoomOut() {
  scale = Math.max(scale - 0.25, 0.5);
  queueRenderPage(pageNum);
}

// Inicialização
(async function init() {
  try {
    const arrayBuffer = await fetchPdfArrayBuffer(docId);
    
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    pdfDoc = await loadingTask.promise;
    
    const pageCountSpan = document.getElementById('page_count');
    if (pageCountSpan) pageCountSpan.textContent = pdfDoc.numPages;

    const btnPrev = document.getElementById('prev');
    const btnNext = document.getElementById('next');
    const btnZoomIn = document.getElementById('zoom_in');
    const btnZoomOut = document.getElementById('zoom_out');

    if (btnPrev) btnPrev.addEventListener('click', onPrevPage);
    if (btnNext) btnNext.addEventListener('click', onNextPage);
    if (btnZoomIn) btnZoomIn.addEventListener('click', onZoomIn);
    if (btnZoomOut) btnZoomOut.addEventListener('click', onZoomOut);

    renderPage(pageNum);
  } catch (err) {
    console.error('Erro no viewer:', err);
    // Alert já tratado na função fetch
  }
})();