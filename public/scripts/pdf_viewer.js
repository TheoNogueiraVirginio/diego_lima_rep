document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const docId = urlParams.get('doc');
    const iframe = document.getElementById('pdf-frame');
    const loading = document.getElementById('loading-msg');
    const downloadBtn = document.getElementById('download-btn');
    const btnSpan = downloadBtn ? downloadBtn.querySelector('span') : null;

    if (!docId) {
        alert('Documento não especificado.');
        if(loading) loading.textContent = 'Erro: Documento não especificado.';
        return;
    }

    // A URL da API que retorna o PDF processado
    const pdfUrl = `/api/pdf/${encodeURIComponent(docId)}`;

    // Define o source do iframe
    iframe.src = pdfUrl;

    // Configura o link de download/abrir externo para dispositivos móveis
    if (downloadBtn) {
        downloadBtn.href = pdfUrl; // Aponta diretamente para o endpoint de PDF
        
        // Detecção simplificada de iOS para ajustar comportamento
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        
        // Em iOS (WebKit), o iframe costuma ter comportamento ruim de scroll e UI.
        // O botão garante que o aluno possa abrir o PDF "de verdade".
        if(isIOS && btnSpan) {
           btnSpan.textContent = "Abrir PDF";
           // Remove atributo download para permitir que o navegador abra no visualizador nativo full-screen
           downloadBtn.removeAttribute('download'); 
        }
    }

    // Monitora o carregamento (navegadores podem não disparar load para iframe)
    iframe.onload = () => {
        if (loading) loading.style.display = 'none';
    };
    
    // Tratamento de segurança (timeout simples)
    setTimeout(() => {
         if (loading) loading.style.display = 'none'; 
    }, 4000);
});
