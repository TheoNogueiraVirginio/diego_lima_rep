// Arquivo derivado de modulo.js — lógica preservada
document.addEventListener('DOMContentLoaded', async () => {
    // Bloqueio de acesso via URL (mantido para possíveis restrições futuras)
    // Impede que um usuário comum acesse módulos restritos diretamente pela URL
    const params = new URLSearchParams(window.location.search);
    const moduloId = params.get('id') || '1';

    /* NÃO PRECISA MAIS BLOQUEAR MÓDULOS, MAS MANTIDO PARA POSSÍVEIS FUTURAS RESTRIÇÕES
    const localUserStatus = localStorage.getItem('userStatus');
    const isLocalAdmin = (localUserStatus === 'ADMIN');

    if (!isLocalAdmin && ['4'].includes(moduloId)) {
        // Função inline para garantir o bloqueio imediato
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.background = 'linear-gradient(180deg, rgba(2,6,90,0.95), rgba(2,6,90,1))';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '99999';

        const box = document.createElement('div');
        box.style.maxWidth = '480px';
        box.style.margin = '20px';
        box.style.background = '#1a2233';
        box.style.border = '1px solid rgba(255,255,255,0.1)';
        box.style.padding = '32px';
        box.style.borderRadius = '16px';
        box.style.textAlign = 'center';
        box.style.color = 'white';
        box.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';

        box.innerHTML = `
            <div style="font-size: 40px; margin-bottom: 16px;">🔒</div>
            <h3 style="font-size: 1.5rem; margin-bottom: 12px; color: #fff;">Módulo Bloqueado</h3>
            <p style="color: #cbd5e1; line-height: 1.5; margin-bottom: 24px;">Para acessar este conteúdo, você precisa concluir as atividades do Módulo 1.</p>
            <button id="btn-voltar-modulos" style="padding: 12px 24px; border-radius: 8px; border: none; font-weight: 600; background: linear-gradient(90deg, #3b82f6, #06b6d4); color: white; cursor: pointer; font-size: 1rem;">Voltar para Módulos</button>
        `;

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        document.getElementById('btn-voltar-modulos').addEventListener('click', () => {
            window.location.href = '/modulos.html';
        });

        // Parar execução do resto do script para não carregar conteúdo
        return;
    }

    // --------------------------------------
    */
    // Fallback de miniatura usado quando não há imagem específica
    const DEFAULT_LOGO = '/images/logo_diego_png.png';

    // Obter dados do usuário via /api/auth/me para determinar modalidade e permissão de admin
    let currentUser = null;
    let userModality = '';
    let isAdmin = false;

    // Tenta obter dados do usuário para atualizar modalidade e status de admin
    try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
            currentUser = await res.json();
            userModality = String(currentUser.modality || '').toLowerCase().trim();
            isAdmin = String(currentUser.status || '').toUpperCase() === 'ADMIN';
        }
    } catch (e) { }

    // const params = new URLSearchParams(window.location.search); // Já declarado acima
    // const moduloId = params.get('id') || '1'; // Já declarado acima

    let mod = null;
    try {
        const res = await fetch(`/api/courses/${moduloId}`);
        if (res.ok) mod = await res.json();
    } catch (e) { console.error('Failed to load course data', e); }

    // Fallback legado: usa window.cursoData se disponível
    if (!mod && window.cursoData) {
        mod = window.cursoData[moduloId];
    }

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

    // Verifica se o item conta para o total de minutos conforme a modalidade do usuário
    const shouldCountTime = (item) => {
        if (!item) return false;

        if (isAdmin) return true;

        if (userModality.includes('integral')) return true;


        if (item.requiredModality) {
            const req = String(item.requiredModality).toLowerCase().trim();
            // APROFUNDAMENTO: conta aulas gerais + exclusivas de "aprofundamento"
            if (userModality === 'aprofundamento') {
                if (req === 'aprofundamento') return true;
                return false;
            }

            // EXTENSIVO (inclui variações: com_material, sem_material)
            const isExtensivoUser = ['extensivo', 'com_material', 'sem_material'].some(v => userModality.includes(v));
            if (isExtensivoUser) {
                if (req === 'extensivo') return true;
                // Extensivo não conta 'aprofundamento'
                return false;
            }

            // Outros casos (se houver): verifica inclusão direta
            return userModality.includes(req);
        }

        // Sem requiredModality = Geral -> Conta para todos
        return true;
    };


    titleEl.textContent = mod.tituloModulo || `Módulo ${moduloId}`;
    descEl.textContent = mod.descricao || '';

    container.innerHTML = '';
    mod.aulas.forEach((aula, idx) => {
        const assuntoIndex = idx + 1;
        const card = document.createElement('div');
        card.className = 'assunto-card';
        // Adicionar atributo data-id para rastrear progresso
        card.setAttribute('data-id', `${moduloId}.${assuntoIndex}`);

        // Calcula total de minutos (aula principal + subaulas)
        let totalMinutes = 0;
        const subs = aula.subAulas || aula.subaulas || [];

        let hasVideo = false;
        if (aula.vimeoId && aula.vimeoId.trim()) hasVideo = true;

        // Duração da aula principal — contada apenas se o usuário tiver acesso
        if (aula.duracao && typeof aula.duracao === 'number') {
            if (shouldCountTime(aula)) {
                totalMinutes += aula.duracao;
            }
        }

        // Duração das subaulas — contadas conforme a modalidade do usuário
        if (Array.isArray(subs)) {
            subs.forEach(s => {
                if (s.vimeoId && String(s.vimeoId).trim()) hasVideo = true;

                if (s.duracao && typeof s.duracao === 'number') {
                    if (shouldCountTime(s)) {
                        totalMinutes += s.duracao;
                    }
                }
            });
        }

        // Texto de status/duração (ex.: 'Em manutenção' ou '(XXmin)')
        let statusText = '';
        if (!hasVideo) {
            statusText = '(Em manutenção)';
        } else {
            statusText = totalMinutes > 0 ? `(${totalMinutes}min)` : '';
        }

        const mat = aula.materiais || {};

        // Processamento de material teórico: suporta `requiredModality` e múltiplos arquivos/versões
        let rawTeorico = mat.teorico || mat.teoria;
        let teoricoUrl = null;
        let hasComplexTeoria = false;

        if (rawTeorico) {
            if (typeof rawTeorico === 'string') {
                teoricoUrl = rawTeorico;
            } else if (typeof rawTeorico === 'object') {
                // Formato legado: objeto com keys como `file`/`url` e possivelmente `requiredModality`
                if (rawTeorico.requiredModality || rawTeorico.file || rawTeorico.url) {
                    const req = rawTeorico.requiredModality;
                    let visible = true;
                    if (req && !isAdmin && !userModality.includes('integral')) {
                        const reqStr = String(req).toLowerCase().trim();
                        if (reqStr === 'extensivo') {
                            const validos = ['extensivo', 'com_material', 'sem_material'];
                            if (!validos.some(v => userModality.includes(v))) visible = false;
                        } else {
                            if (!userModality.includes(reqStr)) visible = false;
                        }
                    }
                    if (visible) {
                        teoricoUrl = rawTeorico.file || rawTeorico.url;
                    }
                } else {
                    // Formato atual: objeto com chaves por modalidade (pe_extensivo, pe_aprofundamento, extensivo, aprofundamento, default)
                    // Verifica se há ao menos uma chave relevante
                    if (rawTeorico.pe_extensivo || rawTeorico.pe_aprofundamento || rawTeorico.extensivo || rawTeorico.aprofundamento || rawTeorico.default) {
                        // Se for ADMIN ou APROFUNDAMENTO, mostra modal com opções
                        if (isAdmin || userModality.includes('aprofundamento') || userModality.includes('integral')) {
                            hasComplexTeoria = true;
                        } else {
                            // Outros alunos abrem direto a versão extensivo (ou equivalente padrão)

                            let tsUrlSource = rawTeorico.pe_extensivo || rawTeorico.extensivo || rawTeorico.default;
                            if (Array.isArray(tsUrlSource) && tsUrlSource.length > 0) {
                                teoricoUrl = tsUrlSource[0];
                                if (tsUrlSource.length > 1) {
                                    hasComplexTeoria = true;
                                }
                            } else {
                                teoricoUrl = tsUrlSource;
                            }
                        }
                    }
                }
            }
        }

        const matListas = (aula.materiais && aula.materiais.listas) || {};
        const hasAnyListas = Object.keys(matListas).length > 0;

        const matGabs = (aula.materiais && aula.materiais.gabaritos) || {};
        const hasAnyGabaritos = Object.keys(matGabs).length > 0;

        // Incluir miniatura específica para aulas de equações (quando identificadas pelo título)
        const tituloAula = aula.titulo || '';
        const isEquacoes = /Equa[cç]o/i.test(tituloAula) || /Equações?/i.test(tituloAula) || tituloAula.includes('Equações');

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
                    ${aula.titulo === 'Caderno Revisional' ? '' : `
                    <li>
                        <a class="link-player" href="assistir.html?id=${moduloId}.${assuntoIndex}">
                            <div class="item-thumb" data-src="/images/images_modulos/image_video.png"></div>
                            <div class="item-info">
                                <span class="item-title">Player de videoaulas</span>
                                <span class="item-sub">Assistir Aula ${statusText}</span>
                            </div>
                        </a>
                    </li>
                    `}
                    <li style="${(teoricoUrl || hasComplexTeoria) ? '' : 'display:none'}">
                        <a href="${teoricoUrl ? `/pdf-viewer/viewer.html?doc=${encodeURIComponent(typeof teoricoUrl === "string" ? teoricoUrl : teoricoUrl.filename)}` : '#'}" target="_blank" class="btn-teoria ${hasComplexTeoria ? 'btn-complex-teoria' : ''}">
                            <div class="item-thumb" data-src="/images/images_modulos/image_pdf.png"></div>
                            <div class="item-info">
                                <span class="item-title">${typeof teoricoUrl === "object" && teoricoUrl !== null && teoricoUrl.title && teoricoUrl.title.trim() !== '' ? teoricoUrl.title : 'Material Teórico'}</span>
                                <span class="item-sub">Ler Resumo</span>
                            </div>
                        </a>
                    </li>
                    <li style="${hasAnyListas ? '' : 'display:none'}">
                        <a href="#" class="btn-lista">
                            <div class="item-thumb" data-src="/images/images_modulos/image_listaExercicios.png"></div>
                            <div class="item-info">
                                <span class="item-title">Para Praticar</span>
                                <span class="item-sub">Praticar</span>
                            </div>
                        </a>
                    </li>
                    <li style="${hasAnyGabaritos ? '' : 'display:none'}">
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

    // Carrega miniaturas dinamicamente após criar os cards
    function tryLoadThumb(el, candidates, i = 0) {
        if (!el || i >= candidates.length) return;
        const url = candidates[i];
        if (!url) return tryLoadThumb(el, candidates, i + 1);
        const img = new Image();
        img.onload = () => {
            if (el.tagName && el.tagName.toUpperCase() === 'IMG') {
                el.src = url;
            } else {
                el.style.backgroundImage = `url('${url}')`;
            }
        };
        img.onerror = () => tryLoadThumb(el, candidates, i + 1);
        img.src = url;
    }

    // Criar e carregar thumbnails para cada card
    document.querySelectorAll('.assunto-card').forEach((card, cardIndex) => {
        const aula = (mod && mod.aulas && mod.aulas[cardIndex]) || {};
        const thumbs = card.querySelectorAll('.item-thumb');
        thumbs.forEach((thumbEl, i) => {
            // Prioriza `aula.thumb`; em seguida tenta por slug, vimeoId e imagens conhecidas; por fim fallback
            const nameSlug = (aula.titulo || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
            const lower = nameSlug.toLowerCase();
            const candidates = [];
            if (aula.thumb) candidates.push(aula.thumb);
            // não tentar imagens específicas por assunto — usaremos o logo como único fallback
            // tentar padrão por vimeoId
            if (aula.vimeoId) candidates.push(`/images/images_assuntos/${aula.vimeoId}.png`);
            // imagens conhecidas
            candidates.push('/images/teste.png');

            // Por fim, fallback global
            candidates.push(DEFAULT_LOGO);

            // se elemento já tem data-src explícito, tentar primeiro
            const dataSrc = thumbEl.getAttribute('data-src');
            if (dataSrc) candidates.unshift(dataSrc);

            tryLoadThumb(thumbEl, candidates);
        });

        // Carregar imagem do header do card (miniatura do assunto)
        const headerThumb = card.querySelector('.assunto-thumb');
        if (headerThumb) {
            const nameSlug = (aula.titulo || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
            const lower = nameSlug.toLowerCase();
            const headerCandidates = [];
            if (aula.thumb) headerCandidates.push(aula.thumb);
            if (nameSlug) headerCandidates.push(`/images/images_assuntos/image_${nameSlug}.png`);
            if (nameSlug) headerCandidates.push(`/images/images_assuntos/${nameSlug}.png`);
            if (aula.vimeoId) headerCandidates.push(`/images/images_assuntos/${aula.vimeoId}.png`);
            // Fallback global
            headerCandidates.push(DEFAULT_LOGO);

            tryLoadThumb(headerThumb, headerCandidates);
        }
    });

    // Helper: cria/abre modal centralizado com lista de opções
    function openModal(title, items) {
        let overlay = document.getElementById('global-modal-overlay');
        if (!overlay) {
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
                if (it.href) window.open(it.href, '_blank');
                closeModal();
            });
            bodyEl.appendChild(btn);
        });

        function onOverlayClick(e) {
            if (e.target === overlay) closeModal();
        }
        function onEsc(e) { if (e.key === 'Escape') closeModal(); }
        function closeModal() {
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

    // Anexa handlers que abrem modais para os botões de materiais
    // Funções auxiliares abaixo ajudam a mapear/normalizar títulos e categorizar o perfil do usuário
    function normalizeTitle(s) {
        return String(s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    }

    function getUserProfileType(user) {
        if (!user) return 'OUTRO';

        const status = String(user.status || '').toUpperCase().trim();
        if (status === 'ADMIN') return 'ADMIN';

        const modality = String(user.modality || '').toUpperCase().trim();
        if (modality.includes('INTEGRAL')) return 'INTEGRAL';
        if (modality.includes('APROFUNDAMENTO')) return 'APROFUNDAMENTO';
        if (modality.includes('EXTENSIVO') || modality.includes('COM_MATERIAL') || modality.includes('SEM_MATERIAL')) return 'EXTENSIVO';

        return 'OUTRO';
    }

    // Mapeamento base removido em favor da configuração explícita externa (dados_aulas.js)

    // Cache do usuário atual (faz fetch apenas uma vez)
    let cachedUser = null;
    async function getCurrentUser() {
        if (cachedUser) return cachedUser;
        try {
            const res = await fetch('/api/auth/me', { credentials: 'include' });
            if (!res.ok) return cachedUser = null;
            const json = await res.json();
            cachedUser = json;
            return cachedUser;
        } catch (e) {
            return cachedUser = null;
        }
    }

    // Verifica existência do PDF via HEAD request
    async function docExists(docId) {
        try {
            const res = await fetch(`/api/pdf/${encodeURIComponent(typeof docId === "string" ? docId : docId.filename)}`, { method: 'HEAD', credentials: 'include' });
            return res.ok;
        } catch (e) {
            return false;
        }
    }

    document.querySelectorAll('.assunto-content a').forEach(anchor => {
        // Determina a aula correspondente ao item usando o índice do card
        const card = anchor.closest('.assunto-card');
        if (!card) return;
        const cards = Array.from(document.querySelectorAll('.assunto-card'));
        const cardIndex = cards.indexOf(card);
        const aula = (mod && mod.aulas && mod.aulas[cardIndex]) || {};

        if (anchor.classList.contains('btn-lista')) {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();

                (async () => {
                    const user = await getCurrentUser();
                    const profileType = getUserProfileType(user);
                    const isAdmin = profileType === 'ADMIN';

                    // Extrai listas do objeto de materiais
                    const listas = (aula.materiais && aula.materiais.listas) || {};
                    const hasExtensivo = listas.pe_extensivo;
                    const hasAprof = listas.pe_aprofundamento;
                    const hasExtra = listas.extra;
                    const hasExtra2 = listas.extra2;
                    const hasCongMod = listas.cong_mod;
                    const hasDefault = listas.default;

                    const items = [];

                    const getLabel = (obj, defaultLabel) => {
                        return (obj && typeof obj === 'object' && obj.title && obj.title.trim() !== '') ? obj.title : defaultLabel;
                    };

                    const addItems = (data, defaultLabel) => {
                        if (!data) return;
                        const arr = Array.isArray(data) ? data : [data];
                        arr.forEach((obj, idx) => {
                            let lbl = getLabel(obj, defaultLabel);
                            if (arr.length > 1 && (!obj || typeof obj !== 'object' || !obj.title || obj.title.trim() === '')) {
                                lbl = `${defaultLabel} - ${idx + 1}`;
                            }
                            const filename = typeof obj === "string" ? obj : obj.filename;
                            if (filename) items.push({ label: lbl, href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(filename)}` });
                        });
                    };

                    if (isAdmin) {
                        addItems(hasExtensivo, 'Praticando ENEM (Extensivo)');
                        addItems(hasAprof, 'Praticando ENEM (Aprofundamento)');
                        addItems(hasDefault, 'Praticando ENEM (Geral)');
                        addItems(hasCongMod, 'Congruência Modular');
                        addItems(hasExtra, 'Lista Extra');
                        addItems(hasExtra2, 'Lista Extra 2');
                    } else if (profileType === 'EXTENSIVO') {
                        addItems(hasExtensivo, 'Praticando ENEM (Extensivo)');
                        addItems(hasDefault, 'Praticando ENEM (Geral)');
                        addItems(hasCongMod, 'Congruência Modular');
                        addItems(hasExtra, 'Lista Extra');
                        addItems(hasExtra2, 'Lista Extra 2');
                    } else if (profileType === 'APROFUNDAMENTO') {
                        addItems(hasAprof, 'Praticando ENEM (Aprofundamento)');
                        addItems(hasDefault, 'Praticando ENEM (Geral)');
                        addItems(hasCongMod, 'Congruência Modular');
                        addItems(hasExtra, 'Lista Extra');
                        addItems(hasExtra2, 'Lista Extra 2');
                    } else if (profileType === 'INTEGRAL') {
                        addItems(hasExtensivo, 'Praticando ENEM (Extensivo)');
                        addItems(hasAprof, 'Praticando ENEM (Aprofundamento)');
                        addItems(hasDefault, 'Praticando ENEM (Geral)');
                        addItems(hasCongMod, 'Congruência Modular');
                        addItems(hasExtra, 'Lista Extra');
                        addItems(hasExtra2, 'Lista Extra 2');
                    } else {
                        addItems(hasDefault, 'Praticando ENEM (Geral)');
                        addItems(hasCongMod, 'Congruência Modular');
                        addItems(hasExtra, 'Lista Extra');
                        addItems(hasExtra2, 'Lista Extra 2');
                    }

                    if (items.length > 0) openModal('Para Praticar', items);
                })();
            });
        }
        if (anchor.classList.contains('btn-gabarito')) {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();

                // Decidir qual PDF mostrar com base na modalidade/status do usuário
                (async () => {
                    const user = await getCurrentUser();
                    const profileType = getUserProfileType(user);
                    const isAdmin = profileType === 'ADMIN';

                    const gabs = (aula.materiais && aula.materiais.gabaritos) || {};

                    const getLabel = (obj, defaultLabel) => {
                        return (obj && typeof obj === 'object' && obj.title && obj.title.trim() !== '') ? obj.title : defaultLabel;
                    };

                    const items = [];
                    const addItems = (data, defaultLabel) => {
                        if (!data) return;
                        const arr = Array.isArray(data) ? data : [data];
                        arr.forEach((obj, idx) => {
                            let lbl = getLabel(obj, defaultLabel);
                            if (arr.length > 1 && (!obj || typeof obj !== 'object' || !obj.title || obj.title.trim() === '')) {
                                lbl = `${defaultLabel} - ${idx + 1}`;
                            }
                            const filename = typeof obj === "string" ? obj : obj.filename;
                            if (filename) items.push({ label: lbl, href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(filename)}` });
                        });
                    };

                    if (isAdmin) {
                        addItems(gabs.pe_extensivo, 'Gabarito (E) - Praticando ENEM');
                        addItems(gabs.pe_aprofundamento, 'Gabarito (A) - Praticando ENEM');
                        addItems(gabs.default, 'Gabarito (Geral)');
                        addItems(gabs.cong_mod, 'Gabarito - Congruência Modular');
                        addItems(gabs.extra, 'Gabarito Extra');
                        addItems(gabs.extra2, 'Gabarito Extra 2');
                    } else if (profileType === 'EXTENSIVO') {
                        addItems(gabs.pe_extensivo, 'Gabarito - Praticando ENEM (Extensivo)');
                        addItems(gabs.default, 'Gabarito (Geral)');
                        addItems(gabs.cong_mod, 'Gabarito - Congruência Modular');
                        addItems(gabs.extra, 'Gabarito Extra');
                        addItems(gabs.extra2, 'Gabarito Extra 2');
                    } else if (profileType === 'APROFUNDAMENTO') {
                        addItems(gabs.pe_aprofundamento, 'Gabarito - Praticando ENEM (Aprofundamento)');
                        addItems(gabs.default, 'Gabarito (Geral)');
                        addItems(gabs.cong_mod, 'Gabarito - Congruência Modular');
                        addItems(gabs.extra, 'Gabarito Extra');
                        addItems(gabs.extra2, 'Gabarito Extra 2');
                    } else if (profileType === 'INTEGRAL') {
                        addItems(gabs.pe_extensivo, 'Gabarito - Praticando ENEM (Extensivo)');
                        addItems(gabs.pe_aprofundamento, 'Gabarito - Praticando ENEM (Aprofundamento)');
                        addItems(gabs.default, 'Gabarito (Geral)');
                        addItems(gabs.cong_mod, 'Gabarito - Congruência Modular');
                        addItems(gabs.extra, 'Gabarito Extra');
                        addItems(gabs.extra2, 'Gabarito Extra 2');
                    } else {
                        addItems(gabs.default, 'Gabarito (Geral)');
                        addItems(gabs.cong_mod, 'Gabarito - Congruência Modular');
                        addItems(gabs.extra, 'Gabarito Extra');
                        addItems(gabs.extra2, 'Gabarito Extra 2');
                    }

                    if (items.length > 0) openModal('Gabaritos', items);
                })();
            });
        }

        if (anchor.classList.contains('btn-teoria')) {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();

                (async () => {
                    const hasComplex = anchor.classList.contains('btn-complex-teoria');
                    const directHref = anchor.getAttribute('href');

                    // Se não for complexo e tiver link direto válido, abrir
                    if (!hasComplex && directHref && directHref !== '#' && directHref !== 'javascript:void(0)') {
                        window.open(directHref, '_blank');
                        return;
                    }

                    // Lógica para modal de teoria
                    const user = await getCurrentUser();
                    const profileType = getUserProfileType(user);
                    const isAdmin = profileType === 'ADMIN';

                    const mat = aula.materiais || {};
                    const rawTeorico = mat.teorico || mat.teoria || {};

                    const items = [];

                    // Helper para adicionar item
                    const add = (label, url) => {
                        if (!url) return;
                        const arr = Array.isArray(url) ? url : [url];
                        arr.forEach((item, idx) => {
                            let actualLabel = (item && typeof item === 'object' && item.title && item.title.trim() !== '') ? item.title : label;
                            if (arr.length > 1 && (!item || typeof item !== 'object' || !item.title || item.title.trim() === '')) {
                                actualLabel = `${label} - ${idx + 1}`;
                            }
                            const filename = typeof item === "string" ? item : item.filename;
                            if (filename) items.push({ label: actualLabel, href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(filename)}` });
                        });
                    };

                    if (isAdmin) {
                        add('Teoria (Extensivo)', rawTeorico.pe_extensivo || rawTeorico.extensivo);
                        add('Teoria (Aprofundamento)', rawTeorico.pe_aprofundamento || rawTeorico.aprofundamento);
                        if (rawTeorico.default) add('Teoria (Geral)', rawTeorico.default);
                        if (rawTeorico.extra) add('Teoria Extra', rawTeorico.extra);
                        if (items.length > 0) openModal('Material Teórico', items);
                        return;
                    }

                    if (profileType === 'EXTENSIVO') {
                        add('Teoria (Geral)', rawTeorico.default);
                        add('Teoria (Extensivo)', rawTeorico.pe_extensivo || rawTeorico.extensivo);
                        if (rawTeorico.extra) add('Teoria Extra', rawTeorico.extra);
                    } else if (profileType === 'APROFUNDAMENTO') {
                        add('Teoria (Geral)', rawTeorico.default);
                        add('Teoria (Aprofundamento)', rawTeorico.pe_aprofundamento || rawTeorico.aprofundamento);
                        if (rawTeorico.extra) add('Teoria Extra', rawTeorico.extra);
                    } else if (profileType === 'INTEGRAL') {
                        add('Teoria (Geral)', rawTeorico.default);
                        add('Teoria (Extensivo)', rawTeorico.pe_extensivo || rawTeorico.extensivo);
                        add('Teoria (Aprofundamento)', rawTeorico.pe_aprofundamento || rawTeorico.aprofundamento);
                        if (rawTeorico.extra) add('Teoria Extra', rawTeorico.extra);
                    } else {
                        add('Teoria (Geral)', rawTeorico.default);
                        if (rawTeorico.extra) add('Teoria Extra', rawTeorico.extra);
                    }

                    if (items.length > 0) {
                        openModal('Material Teórico', items);
                    } else {
                        // Caso fallback: nenhum material encontrado. Normalmente este botão estaria oculto.
                    }

                })();
            });
        }
    });

    try {
        const nomeSalvo = localStorage.getItem('nomeAluno');
        if (nomeSalvo && nomeEl) {
            const primeiroNome = nomeSalvo.split(' ')[0].toLowerCase();
            const primeiroNomeOrganizado = primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1);
            nomeEl.textContent = primeiroNomeOrganizado;
        }
    } catch (e) { }

    if (barraVerde) barraVerde.style.width = '0%';

    async function loadProgress() {
        try {
            const res = await fetch('/api/progress/lessons/me', { credentials: 'include' });
            if (!res.ok) return applyProgress(0, 10); // fallback default

            const items = await res.json();
            const completedIds = items
                .filter(p => String(p.status).toUpperCase() === 'COMPLETED')
                .map(p => String(p.lessonId));

            // Calcular TOTAL de itens para este módulo (Espaço amostral = soma de todas as aulas e subaulas)
            let totalItems = 0;
            let completedCount = 0;

            if (mod && mod.aulas) {
                mod.aulas.forEach((aula, idx) => {
                    const assuntoId = `${moduloId}.${idx + 1}`;

                    // Contar subaulas
                    const subs = aula.subAulas || aula.subaulas || [];
                    if (subs.length > 0) {
                        subs.forEach((sub, sIdx) => {
                            totalItems++;
                            const subId = `${assuntoId}.${sIdx + 1}`;
                            if (completedIds.includes(subId)) {
                                completedCount++;
                            }
                        });
                        // Se a aula possui subaulas, conta cada subaula; conta a aula principal apenas
                        // se houver vimeoId (indicando conteúdo principal separado)
                        if (aula.vimeoId) {
                            totalItems++;
                            if (completedIds.includes(assuntoId)) completedCount++;
                        }
                    } else {
                        // Se não tem subaulas, conta a própria aula
                        // Apenas se tiver conteudo? Ou sempre?
                        // Vamos assumir sempre contado como 1 item
                        totalItems++;
                        if (completedIds.includes(assuntoId)) {
                            completedCount++;
                        }
                    }
                });
            }

            // Fallback se totalItems for 0 (evitar divisão por zero)
            const finalTotal = totalItems > 0 ? totalItems : (mod.aulas ? mod.aulas.length : 1);

            applyProgress(completedCount, finalTotal);

        } catch (err) {
            console.warn('Erro ao carregar progresso do módulo', err);
            applyProgress(0, 1);
        }
    }

    function applyProgress(completedCount, total) {
        const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
        const destaque = document.querySelector('.destaque-verde');
        if (destaque) destaque.textContent = percent + '%';
        if (barraVerde) barraVerde.style.width = percent + '%';
    }

    window.loadProgress = loadProgress;
    loadProgress();

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
});
