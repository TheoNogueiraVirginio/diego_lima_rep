// Arquivo renomeado a partir de modulo.js — mantém a mesma lógica
document.addEventListener('DOMContentLoaded', () => {
    // fallback único para todas as miniaturas dos assuntos
    const DEFAULT_LOGO = '/images/logo_diego_png.png';
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
        
        const mat = aula.materiais || {};

        // incluir miniatura para aulas de equações (se identificadas pelo título)
        const isEquacoes = /Equa[cç]o/i.test(aula.titulo) || /Equações?/i.test(aula.titulo) || aula.titulo.includes('Equações');

        card.innerHTML = `
            <button class="assunto-header" aria-expanded="false">
                <div class="assunto-left">
                    <img class="assunto-thumb" src="${DEFAULT_LOGO}" alt="miniatura">
                    <span class="assunto-title">${escapeHtml(aula.titulo)}</span>
                </div>
                <span class="assunto-toggle">▾</span>
            </button>
            <div class="assunto-content">
                <ul>
                    <li>
                        <a class="link-player" href="assistir.html?id=${moduloId}.${assuntoIndex}">
                            <div class="item-thumb" data-src="/images/images_modulos/image_video.png"></div>
                            <div class="item-info">
                                <span class="item-title">Player de videoaulas</span>
                                <span class="item-sub">Assistir Aula (15min)</span>
                            </div>
                        </a>
                    </li>
                    <li>
                        <a href="${mat.teorico ? `/pdf-viewer/viewer.html?doc=${encodeURIComponent(mat.teorico)}` : '#'}" ${mat.teorico ? 'target="_blank"' : ''}>
                            <div class="item-thumb" data-src="/images/images_modulos/image_pdf.png"></div>
                            <div class="item-info">
                                <span class="item-title">Material Teórico</span>
                                <span class="item-sub">Ler Resumo</span>
                            </div>
                        </a>
                    </li>
                    <li>
                        <a href="#" class="btn-lista">
                            <div class="item-thumb" data-src="/images/images_modulos/image_listaExercicios.png"></div>
                            <div class="item-info">
                                <span class="item-title">Listas de Exercícios</span>
                                <span class="item-sub">Praticar</span>
                            </div>
                        </a>
                    </li>
                    <li>
                        <a href="#" class="btn-gabarito">
                            <div class="item-thumb" data-src="/images/images_modulos/image_gabarito.png"></div>
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

    // após criar todos os cards, tentar carregar as miniaturas dinamicamente
    function tryLoadThumb(el, candidates, i = 0){
        if (!el || i >= candidates.length) return;
        const url = candidates[i];
        if (!url) return tryLoadThumb(el, candidates, i+1);
        const img = new Image();
        img.onload = () => {
                if (el.tagName && el.tagName.toUpperCase() === 'IMG') {
                    el.src = url;
                } else {
                    el.style.backgroundImage = `url('${url}')`;
                }
        };
        img.onerror = () => tryLoadThumb(el, candidates, i+1);
        img.src = url;
    }

    // criar thumbs para cada card
    document.querySelectorAll('.assunto-card').forEach((card, cardIndex) => {
        const aula = (mod && mod.aulas && mod.aulas[cardIndex]) || {};
        const thumbs = card.querySelectorAll('.item-thumb');
        thumbs.forEach((thumbEl, i) => {
            // priorizar campo aula.thumb, senão tentar por título slug, senão fallback
            const nameSlug = (aula.titulo || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g,'');
            const lower = nameSlug.toLowerCase();
            const candidates = [];
            if (aula.thumb) candidates.push(aula.thumb);
            // não tentar imagens específicas por assunto — usaremos o logo como único fallback
            // tentar padrão por vimeoId
            if (aula.vimeoId) candidates.push(`/images/images_assuntos/${aula.vimeoId}.png`);
            // imagens conhecidas
            candidates.push('/images/teste.png');

            // por fim, fallback único e centralizado
            candidates.push(DEFAULT_LOGO);

            // se elemento já tem data-src explícito, tentar primeiro
            const dataSrc = thumbEl.getAttribute('data-src');
            if (dataSrc) candidates.unshift(dataSrc);

            tryLoadThumb(thumbEl, candidates);
        });

        // carregar miniatura do header (assunto) se existir placeholder ou imagem já colocada
        const headerThumb = card.querySelector('.assunto-thumb');
        if (headerThumb) {
            const nameSlug = (aula.titulo || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g,'');
            const lower = nameSlug.toLowerCase();
            const headerCandidates = [];
            if (aula.thumb) headerCandidates.push(aula.thumb);
            if (nameSlug) headerCandidates.push(`/images/images_assuntos/image_${nameSlug}.png`);
            if (nameSlug) headerCandidates.push(`/images/images_assuntos/${nameSlug}.png`);
            if (aula.vimeoId) headerCandidates.push(`/images/images_assuntos/${aula.vimeoId}.png`);
            // fallback único e centralizado
            headerCandidates.push(DEFAULT_LOGO);

            tryLoadThumb(headerThumb, headerCandidates);
        }
    });

    // Modal helper: cria/abre modal centralizado com opções
    function openModal(title, items){
        let overlay = document.getElementById('global-modal-overlay');
        if (!overlay){
            overlay = document.createElement('div');
            overlay.id = 'global-modal-overlay';
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `<div class="modal-window" role="dialog" aria-modal="true">
                <div class="modal-header">
                    <div class="modal-title"></div>
                    <button class="modal-close" aria-label="Fechar">✕</button>
                </div>
                <div class="modal-body"></div>
            </div>`;
            document.body.appendChild(overlay);
        }

        const modalWindow = overlay.querySelector('.modal-window');
        const titleEl = overlay.querySelector('.modal-title');
        const bodyEl = overlay.querySelector('.modal-body');
        const closeBtn = overlay.querySelector('.modal-close');

        titleEl.textContent = title || '';
        bodyEl.innerHTML = '';

        items.forEach(it => {
            const btn = document.createElement('button');
            btn.className = 'modal-option';
            btn.type = 'button';
            btn.textContent = it.label;
            btn.addEventListener('click', () => {
                if (it.href) window.location.href = it.href;
                closeModal();
            });
            bodyEl.appendChild(btn);
        });

        function onOverlayClick(e){
            if (e.target === overlay) closeModal();
        }
        function onEsc(e){ if (e.key === 'Escape') closeModal(); }
        function closeModal(){
            overlay.classList.remove('active');
            overlay.removeEventListener('click', onOverlayClick);
            document.removeEventListener('keydown', onEsc);
        }

        closeBtn.onclick = closeModal;
        overlay.addEventListener('click', onOverlayClick);
        document.addEventListener('keydown', onEsc);

        overlay.classList.add('active');
        // foco no primeiro botão
        setTimeout(() => {
            const first = bodyEl.querySelector('.modal-option');
            if (first) first.focus();
        }, 50);
    }

    // Anexar handlers para abrir modal quando clicar nas opções correspondentes
    // mapeamento de títulos (normalizados) -> docId (em api/storage/pdfs)
    function normalizeTitle(s){
        return String(s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9\s]/g,'').replace(/\s+/g,' ').trim();
    }

    // Mapeamento base removido a favor da configuração explícita em dados_aulas.js

    // Cache do usuário atual (fetch uma vez)
    let cachedUser = null;
    async function getCurrentUser(){
        if (cachedUser) return cachedUser;
        try{
            const res = await fetch('/api/auth/me', { credentials: 'include' });
            if (!res.ok) return cachedUser = null;
            const json = await res.json();
            cachedUser = json;
            return cachedUser;
        } catch(e){
            return cachedUser = null;
        }
    }

    // testa rapidamente se um doc existe (HEAD request)
    async function docExists(docId){
        try{
            const res = await fetch(`/api/pdf/${encodeURIComponent(docId)}`, { method: 'HEAD', credentials: 'include' });
            return res.ok;
        } catch(e){
            return false;
        }
    }

    document.querySelectorAll('.assunto-content .item-title').forEach(el => {
        const text = (el.textContent || '').trim().toLowerCase();
        const anchor = el.closest('a');
        if (!anchor) return;
        // determinar qual assunto esse item pertence (usar index do card)
        const card = el.closest('.assunto-card');
        const cards = Array.from(document.querySelectorAll('.assunto-card'));
        const cardIndex = cards.indexOf(card);
        const aula = (mod && mod.aulas && mod.aulas[cardIndex]) || {};
        
        if (text.includes('lista')){
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                
                (async () => {
                   const user = await getCurrentUser();
                   const modality = user && (user.modality || '').toUpperCase();
                   const isAdmin = user && String(user.status).toUpperCase() === 'ADMIN';

                   // Dados novos
                   const listas = (aula.materiais && aula.materiais.listas) || {};
                   const hasExtensivo = listas.pe_extensivo;
                   const hasAprof = listas.pe_aprofundamento;
                   const hasExtra = listas.extra;
                   
                   const items = [];

                   // Se for ADMIN, mostrar tudo
                   if (isAdmin) {
                         if (hasExtensivo) items.push({ label: 'Lista Praticando ENEM (Extensivo)', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(hasExtensivo)}` });
                         if (hasAprof) items.push({ label: 'Lista Praticando ENEM (Aprofundamento)', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(hasAprof)}` });
                         
                         // Se não tiver nenhum dos dois cadastrado, fallback
                         if (!hasExtensivo && !hasAprof) {
                             items.push({ label: 'Praticando ENEM', href: 'questoes.html?lista=praticando-enem' });
                         }

                         if (hasExtra) items.push({ label: 'Lista Extra', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(hasExtra)}` });
                         else items.push({ label: 'Lista Extra', href: 'questoes.html?lista=lista-extra' });

                         openModal('Listas de Exercícios', items);
                         return;
                   }

                   // SEPARAÇÃO SOLICITADA PARA ALUNOS
                   // Se o aluno for APROFUNDAMENTO, ele vê as duas opções separadas se existirem? 
                   // Ou se ele for EXTENSIVO ele vê só a extensiva?
                   // Assumindo que:
                   // APROFUNDAMENTO -> Vê Aprofundamento E Extensivo (como opções separadas)
                   // EXTENSIVO -> Vê Extensivo
                   
                   if (modality === 'APROFUNDAMENTO') {
                       if (hasAprof) items.push({ label: 'Praticando ENEM (Aprofundamento)', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(hasAprof)}` });
                       if (hasExtensivo) items.push({ label: 'Praticando ENEM (Extensivo)', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(hasExtensivo)}` });
                       
                       // Se não tem nenhum, fallback
                       if (!hasAprof && !hasExtensivo) items.push({ label: 'Praticando ENEM', href: 'questoes.html?lista=praticando-enem' });

                   } else {
                       // Alunos EXTENSIVO ou outros
                       if (hasExtensivo) items.push({ label: 'Praticando ENEM', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(hasExtensivo)}` });
                       else items.push({ label: 'Praticando ENEM', href: 'questoes.html?lista=praticando-enem' });
                   }

                   // Lista Extra (sempre disponível)
                   if (hasExtra) {
                       items.push({ label: 'Lista Extra', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(hasExtra)}` });
                   } else {
                       items.push({ label: 'Lista Extra', href: 'questoes.html?lista=lista-extra' });
                   }

                   openModal('Listas de Exercícios', items);
                })();
            });
        }
        if (text.includes('gabarit')){
            anchor.addEventListener('click', (e) => {
                e.preventDefault();

                // Decidir qual PDF mostrar com base na modalidade/status do usuário
                (async () => {
                    const user = await getCurrentUser();
                    const isAdmin = user && String(user.status).toUpperCase() === 'ADMIN';
                    const modality = user && (user.modality || '').toUpperCase();

                    const gabs = (aula.materiais && aula.materiais.gabaritos) || {};

                    // Admin vê tudo que estiver disponível
                    if (isAdmin) {
                        const items = [];
                        if (gabs.pe_extensivo) items.push({ label: 'Gabarito (E) - Praticando ENEM', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(gabs.pe_extensivo)}` });
                        if (gabs.pe_aprofundamento) items.push({ label: 'Gabarito (A) - Praticando ENEM', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(gabs.pe_aprofundamento)}` });
                        if (gabs.extra) items.push({ label: 'Gabarito Extra', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(gabs.extra)}` });
                        
                        // Fallback caso não tenha nada cadastrado
                        if (items.length === 0){
                             items.push({ label: 'Lista extra', href: 'questoes.html?gabarito=lista-extra' });
                        }
                        openModal('Gabaritos', items);
                        return;
                    }

                    const items = [];
                    // Lógica para Aluno
                    let mainLink = null;
                    let label = 'Praticando ENEM';

                    if (modality === 'APROFUNDAMENTO'){
                        if (gabs.pe_aprofundamento) {
                            mainLink = `/pdf-viewer/viewer.html?doc=${encodeURIComponent(gabs.pe_aprofundamento)}`;
                            label = 'Praticando ENEM (Aprof.)';
                        } else if (gabs.pe_extensivo) {
                            mainLink = `/pdf-viewer/viewer.html?doc=${encodeURIComponent(gabs.pe_extensivo)}`;
                        }
                    } else {
                        // Extensivo e outros
                        if (gabs.pe_extensivo) {
                            mainLink = `/pdf-viewer/viewer.html?doc=${encodeURIComponent(gabs.pe_extensivo)}`;
                        }
                    }

                    if (mainLink) {
                        items.push({ label: label, href: mainLink });
                    } else {
                        // fallback
                        items.push({ label: 'Praticando ENEM', href: 'questoes.html?gabarito=praticando-enem' });
                    }

                    // Extra
                    if (gabs.extra) {
                         items.push({ label: 'Gabarito Extra', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(gabs.extra)}` });
                    } else {
                         items.push({ label: 'Lista extra', href: 'questoes.html?gabarito=lista-extra' });
                    }

                    openModal('Gabaritos', items);
                })();
            });
        }
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
