// Configurações básicas do viewer usando PDF.js
const urlParams = new URLSearchParams(window.location.search);
const docId = urlParams.get('doc') || 'sample'; // usar ?doc=nome_do_arquivo

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

async function fetchPdfArrayBuffer(docId) {
  const resp = await fetch(`/api/pdf/${encodeURIComponent(docId)}`, { credentials: 'include' });
  if (!resp.ok) throw new Error('Não foi possível obter o PDF: ' + resp.status);
  return await resp.arrayBuffer();
}

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

  document.getElementById('page_num').textContent = num;
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
    document.getElementById('page_count').textContent = pdfDoc.numPages;
    document.getElementById('prev').addEventListener('click', onPrevPage);
    document.getElementById('next').addEventListener('click', onNextPage);
    document.getElementById('zoom_in').addEventListener('click', onZoomIn);
    document.getElementById('zoom_out').addEventListener('click', onZoomOut);
    renderPage(pageNum);
  } catch (err) {
    console.error(err);
    alert('Erro ao carregar o PDF. Verifique se você está autenticado e se o documento existe.');
  }
})();
