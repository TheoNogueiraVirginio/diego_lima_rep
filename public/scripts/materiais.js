// Arquivo renomeado a partir de modulo.js — mantém a mesma lógica
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const moduloId = params.get('id') || '1';

    const data = window.cursoData || {};
    const mod = data[moduloId];

    const titleEl = document.getElementById('modulo-title');
    const descEl = document.getElementById('modulo-desc');
    const container = document.getElementById('assuntos-container');
    const nomeEl = document.getElementById('nome-aluno');
    const barraVerde = document.querySelector('.barra-verde');

    if (!mod) {
        titleEl.textContent = 'Módulo não encontrado';
        container.innerHTML = '<div class="no-content">Módulo não encontrado</div>';
        return;
    }

    titleEl.textContent = mod.tituloModulo || `Módulo ${moduloId}`;
    descEl.textContent = mod.descricao || '';

    container.innerHTML = '';
    mod.aulas.forEach((aula, idx) => {
        const assuntoIndex = idx + 1;
        const card = document.createElement('div');
        card.className = 'assunto-card';

        // incluir miniatura para aulas de equações (se identificadas pelo título)
        const isEquacoes = /Equa[cç]o/i.test(aula.titulo) || /Equações?/i.test(aula.titulo) || aula.titulo.includes('Equações');

        card.innerHTML = `
            <button class="assunto-header" aria-expanded="false">
                <div class="assunto-left">
                    ${isEquacoes ? '<img class="assunto-thumb" src="/images/images_assuntos/image_funcaoFx.png" alt="miniatura">' : ''}
                    <span class="assunto-title">${escapeHtml(aula.titulo)}</span>
                </div>
                <span class="assunto-toggle">▾</span>
            </button>
            <div class="assunto-content">
                <ul>
                    <li>
                        <a class="link-player" href="assistir.html?id=${moduloId}.${assuntoIndex}">
                            ${isEquacoes ? `
                                <div class="item-thumb" style="background-image:url('/images/images_assuntos/image_funcaoFx.png')"></div>
                            ` : `
                                <div class="item-thumb" data-src=""></div>
                            `}
                            <div class="item-info">
                                <span class="item-title">Player de videoaulas</span>
                                <span class="item-sub">Assistir Aula (15min)</span>
                            </div>
                        </a>
                    </li>
                    <li>
                        <a href="#">
                            <div class="item-thumb" data-src=""></div>
                            <div class="item-info">
                                <span class="item-title">Material Teórico</span>
                                <span class="item-sub">Ler Resumo</span>
                            </div>
                        </a>
                    </li>
                    <li>
                        <a href="#">
                            <div class="item-thumb" data-src=""></div>
                            <div class="item-info">
                                <span class="item-title">Lista de Exercícios</span>
                                <span class="item-sub">Praticar</span>
                            </div>
                        </a>
                    </li>
                    <li>
                        <a href="#">
                            <div class="item-thumb" data-src=""></div>
                            <div class="item-info">
                                <span class="item-title">Gabarito</span>
                                <span class="item-sub">Conferir Respostas</span>
                            </div>
                        </a>
                    </li>
                </ul>
            </div>
        `;

        const header = card.querySelector('.assunto-header');
        const content = card.querySelector('.assunto-content');
        header.addEventListener('click', () => {
            const expanded = header.getAttribute('aria-expanded') === 'true';
            document.querySelectorAll('.assunto-card').forEach(other => {
                other.classList.remove('ativo');
                const h = other.querySelector('.assunto-header');
                const c = other.querySelector('.assunto-content');
                if (h) h.setAttribute('aria-expanded', 'false');
                if (c) c.style.maxHeight = null;
            });

            if (!expanded) {
                card.classList.add('ativo');
                header.setAttribute('aria-expanded', 'true');
                content.style.maxHeight = content.scrollHeight + 'px';
            } else {
                card.classList.remove('ativo');
                header.setAttribute('aria-expanded', 'false');
                content.style.maxHeight = null;
            }
        });

        content.style.maxHeight = null;

        container.appendChild(card);
    });

    try{
        const nomeSalvo = localStorage.getItem('nomeAluno');
        if (nomeSalvo && nomeEl) {
            const primeiroNome = nomeSalvo.split(' ')[0].toLowerCase();
            const primeiroNomeOrganizado = primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1);
            nomeEl.textContent = primeiroNomeOrganizado;
        }
    } catch(e){}

    if (barraVerde) barraVerde.style.width = '0%';

    const MODULE_TOTALS = { '1': 7, '2': 6, '3': 6, '4': 7 };

    async function loadProgress(){
        try {
            const res = await fetch('/api/progress/lessons/me', { credentials: 'include' });
            if (!res.ok) return applyProgress(0, MODULE_TOTALS[moduloId] || 0);
            const items = await res.json();
            const completed = items.filter(p => String(p.status).toUpperCase() === 'COMPLETED')
                .map(p => String(p.lessonId))
                .filter(id => id && id.startsWith(moduloId + '.'));
            const completedCount = new Set(completed).size;
            const total = MODULE_TOTALS[moduloId] || (mod.aulas ? mod.aulas.length : 0);
            applyProgress(completedCount, total);
        } catch (err) {
            console.warn('Erro ao carregar progresso do módulo', err);
            applyProgress(0, MODULE_TOTALS[moduloId] || 0);
        }
    }

    function applyProgress(completedCount, total){
        const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
        const destaque = document.querySelector('.destaque-verde');
        if (destaque) destaque.textContent = percent + '%';
        if (barraVerde) barraVerde.style.width = percent + '%';
    }

    window.loadProgress = loadProgress;
    loadProgress();

    function escapeHtml(str){
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
    }
});
