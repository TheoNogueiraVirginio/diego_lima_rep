document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const docId = urlParams.get('doc');
    const iframe = document.getElementById('pdf-frame');
    const loading = document.querySelector('.loading');

    if (!docId) {
        alert('Documento não especificado.');
        loading.textContent = 'Erro: Documento não especificado.';
        return;
    }

    // A URL da API que retorna o PDF processado
    // O navegador envia automaticamente os cookies de autenticação (HttpOnly)
    const pdfUrl = `/api/pdf/${encodeURIComponent(docId)}`;

    // Define o source do iframe
    iframe.src = pdfUrl;

    // Tratamento básico de erro de carregamento (opcional, pois o navegador lida com erros de iframe)
    iframe.onload = () => {
        loading.style.display = 'none';
    };
    
    // Fallback simples para timeout
    setTimeout(() => {
         loading.style.display = 'none'; // Esconde loading após 5s se não disparar onload
    }, 5000);
});
