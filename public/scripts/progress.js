document.addEventListener('DOMContentLoaded', () => {
  loadProgress();
});

async function loadProgress() {
  try {
    // Tentar primeiro o resumo autenticado; em 401 exibir banner e fazer fallback público
    let data = null;
    try {
      const authRes = await fetch('/api/progress/summary/me', { credentials: 'include' });
      if (authRes.ok) {
        data = await authRes.json();
      } else if (authRes.status === 401) {
        if (window.showLoginBanner) window.showLoginBanner();
        const pubRes = await fetch('/api/progress/summary', { credentials: 'include' });
        if (pubRes.ok) data = await pubRes.json();
        else return;
      } else {
        const pubRes = await fetch('/api/progress/summary', { credentials: 'include' });
        if (pubRes.ok) data = await pubRes.json();
        else return;
      }
    } catch (e) {
      console.error('Erro ao buscar summary (auth/public)', e);
      return;
    }

    // Tenta obter nome do usuário — se falhar, não aborta (público também funciona)
    try {
      const meRes = await fetch('/api/auth/me', { credentials: 'include' });
      if (meRes.status === 401) {
        if (window.showLoginBanner) window.showLoginBanner();
      }
    } catch (e) {
      // ignore
    }

    // Atualiza barra geral (aulas ou simulados dependendo da página)
    const statusContainer = document.querySelector('.status-container');
    if (statusContainer) {
      const destaque = statusContainer.querySelector('.destaque-verde');
      const barra = statusContainer.querySelector('.barra-verde');
      // Se estivermos na página de simulados (elementos .modulo-card ou .modulos-container), preferir o progresso de simulados
      const lessonsPercent = data?.lessons?.percent;
      const examsPercent = data?.exams?.percent;
      const isSimuladosPage = !!document.querySelector('.modulo-card') || !!document.querySelector('.modulos-container');
      const value = isSimuladosPage
        ? (examsPercent != null ? examsPercent : (lessonsPercent != null ? lessonsPercent : 0))
        : (lessonsPercent != null ? lessonsPercent : (examsPercent != null ? examsPercent : 0));
      if (destaque) destaque.textContent = `${value}%`;
      if (barra) barra.style.width = `${value}%`;
    }

    // Se estiver na página de simulados, atualizar barras por módulo
    const moduleCards = document.querySelectorAll('.modulo-card, .modulo');
    if (moduleCards && moduleCards.length > 0) {
      const modules = data?.modules || [];
      // modules is array of { moduleId, averageScore, examsTakenCount }
      moduleCards.forEach((card, idx) => {
        const modIndex = idx + 1; // assume modules numbered 1..n in order
        const moduleData = modules.find(m => String(m.moduleId) === String(modIndex)) || null;
        const percent = moduleData ? Math.round(moduleData.averageScore) : 0;

        const destaque = card.querySelector('.destaque-verde');
        const barraMod = card.querySelector('.barra-verde-mod');
        if (destaque) destaque.textContent = `${percent}%`;
        if (barraMod) barraMod.style.width = `${percent}%`;
      });
    }

    // Marcar aulas individuais como concluídas (procura por elementos com data-id="1.1" etc.)
    try {
      const lessonsRes = await fetch('/api/progress/lessons/me', { credentials: 'include' });
      if (lessonsRes.ok) {
        const lessons = await lessonsRes.json();
        lessons.forEach(lp => {
          try {
            const lid = String(lp.lessonId);
            if (String(lp.status).toUpperCase() === 'COMPLETED') {
              // Seleção robusta: percorre elementos com data-id e compara estritamente o valor
              const candidates = document.querySelectorAll('[data-id]');
              let matched = 0;
              candidates.forEach(el => {
                try {
                  const val = el.getAttribute('data-id');
                  if (val === lid) {
                    matched++;
                    // se for botão de simulado
                    if (el.tagName === 'BUTTON') {
                      el.textContent = 'Concluído';
                      el.disabled = true;
                      el.classList.add('done');
                    }
                    el.classList.add('lesson-completed');
                  }
                } catch (e2) {
                  // ignore per-element
                }
              });
              // Log leve para ajudar debug quando algo marca muitos itens
              if (matched > 1) console.debug(`progress.js: lesson ${lid} matched ${matched} elements`);
            }
          } catch (e) {
            // ignore per-item errors
          }
        });
      } else if (lessonsRes.status === 401) {
        if (window.showLoginBanner) window.showLoginBanner();
      }
    } catch (e) {
      // ignore
    }

  } catch (err) {
    // fail silently
    console.error('loadProgress error', err);
  }
}

// Expor para que outras páginas/scripts possam forçar recarregar o progresso
window.loadProgress = loadProgress;
