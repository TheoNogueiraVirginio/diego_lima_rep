document.addEventListener('DOMContentLoaded', () => {
  loadProgress();
});

async function loadProgress() {
  try {
    // 1. Fetch summary first (auth or public)
    let data = null;
    try {
      const authRes = await fetch('/api/progress/summary/me', { credentials: 'include' });
      if (authRes.ok) {
        data = await authRes.json();
      } else {
        const pubRes = await fetch('/api/progress/summary', { credentials: 'include' });
        if (pubRes.ok) data = await pubRes.json();
      }
    } catch (e) {
      console.error('Erro ao buscar summary', e);
    }
    
    // Tenta obter nome do usuário
    try {
      await fetch('/api/auth/me', { credentials: 'include' });
    } catch (e) {}

    // 2. Fetch detailed completed lessons (needed for calculation and marking UI)
    let completedLessons = [];
    try {
        const lessonsRes = await fetch('/api/progress/lessons/me', { credentials: 'include' });
        if (lessonsRes.ok) {
            const lessons = await lessonsRes.json();
            // Filter only completed
            completedLessons = lessons
                .filter(l => String(l.status).toUpperCase() === 'COMPLETED')
                .map(l => String(l.lessonId));
        } else if (lessonsRes.status === 401 && window.showLoginBanner) {
            window.showLoginBanner();
        }
    } catch(e) { /* ignore */ }

    // 3. Recalculate LESSONS Percent if cursoData is available (Client-side Override)
    // REMOVIDO: A lógica agora reside inteiramente no backend (progressController.js)
    // que lê dados_aulas.js dinamicamente e calcula o percentual correto.
    
    /* -------------------------------------------------------------
       UI UPDATES
    ------------------------------------------------------------- */

    // Atualiza barra geral
    const statusContainer = document.querySelector('.status-container');
    if (statusContainer) {
      const destaque = statusContainer.querySelector('.destaque-verde');
      const barra = statusContainer.querySelector('.barra-verde');
      
      const lessonsPercent = data?.lessons?.percent || 0;
      const examsPercent = data?.exams?.percent || 0;
      
      // Detecção de página de simulados
      const isSimuladosSpecific = !!document.querySelector('.simulado-box') || !!document.querySelector('.btn-fazer-simulado') || window.location.pathname.includes('simulados');
      
      const value = isSimuladosSpecific ? examsPercent : lessonsPercent;
      
      if (destaque) destaque.textContent = `${value}%`;
      if (barra) barra.style.width = `${value}%`;
    }

    // Se estiver na página de simulados, atualizar barras por módulo (cards)
    const moduleCards = document.querySelectorAll('.modulo-card, .modulo');
    // Para evitar conflito em modulos.html (que não exibe progresso interno no card na imagem),
    // aplicamos apenas se for página de simulados ou se os elementos existirem
    const isSimuladosPage = !!document.querySelector('.simulado-box') || window.location.pathname.includes('simulados');

    if (moduleCards && moduleCards.length > 0 && isSimuladosPage) {
      const modules = data?.modules || [];
      moduleCards.forEach((card, idx) => {
        const modIndex = idx + 1;
        const moduleData = modules.find(m => String(m.moduleId) === String(modIndex)) || null;
        const percent = moduleData ? Math.round(moduleData.averageScore) : 0;

        const destaque = card.querySelector('.destaque-verde');
        const barraMod = card.querySelector('.barra-verde-mod');
        if (destaque) destaque.textContent = `${percent}%`;
        if (barraMod) barraMod.style.width = `${percent}%`;
      });
    }

    // Marcações UI de aulas concluídas
    completedLessons.forEach(lid => {
        const candidates = document.querySelectorAll(`[data-id="${lid}"]`);
        candidates.forEach(el => {
            if (el.tagName === 'BUTTON') {
                el.textContent = 'Concluído';
                el.disabled = true;
                el.classList.add('done');
            }
            el.classList.add('lesson-completed');
        });
    });

  } catch (err) {
    console.error('loadProgress error', err);
  }
}

// Expor para que outras páginas/scripts possam forçar recarregar o progresso
window.loadProgress = loadProgress;
