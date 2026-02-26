// Arquivo renomeado a partir de modulo.js — mantém a mesma lógica
document.addEventListener('DOMContentLoaded', async () => {
    // --- TRAVA DE SEGURANÇA (URL HACK) ---
    // Impede que usuário comum acesse módulos 2, 3 ou 4 direto pela URL
    const params = new URLSearchParams(window.location.search);
    const moduloId = params.get('id') || '1';

    const localUserStatus = localStorage.getItem('userStatus');
    const isLocalAdmin = (localUserStatus === 'ADMIN');

    if (!isLocalAdmin && ['2', '3', '4'].includes(moduloId)) {
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

    // fallback único para todas as miniaturas dos assuntos
    const DEFAULT_LOGO = '/images/logo_diego_png.png';
    
    // Obter dados do usuário para verificação de modalidade
    let currentUser = null;
    let userModality = '';
    let isAdmin = false;

    // Tentar obter sessão real para atualizar nomes, mas a trava local já agiu se necessário
    try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
            currentUser = await res.json();
            userModality = String(currentUser.modality || '').toLowerCase().trim();
            isAdmin = String(currentUser.status || '').toUpperCase() === 'ADMIN';
        }
    } catch(e) {}
    
    // const params = new URLSearchParams(window.location.search); // Já declarado acima
    // const moduloId = params.get('id') || '1'; // Já declarado acima

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

    // Helper: verifica se o item deve contar para a soma de minutos com base na modalidade
    const shouldCountTime = (item) => {
        if (!item) return false;
        
        if (isAdmin) return true;

        if (userModality.includes('integral')) return true;


        if (item.requiredModality) {
            const req = String(item.requiredModality).toLowerCase().trim();
            // APROFUNDAMENTO: conta aulas gerais + exclusivas de "aprofundamento"
            if (userModality === 'aprofundamento') {
                if (req === 'aprofundamento') return true;
                // Se for extensivo, o aluno de aprofundamento vê? 
                // Assumindo que aprofundamento inclui conteudo extensivo?
                // A regra diz: "caso seja APROFUNDAMENTO, conte as alunas gerais e as exclusivas do aprofundamento."
                // Isso PODE implicar que ele não vê 'extensivo' exclusivo se houver.
                // Mas, geralmente, Aprofundamento vê tudo do Extensivo.
                // Vou seguir estritamente o pedido: "conte gerais e exclusivas do aprofundamento".
                // Se existir uma aula com requiredModality="extensivo" ela seria ignorada aqui?
                // Se sim, ok. Se ele deveria ver, então a regra precisa ser mais ampla.
                // Vou assumir que "gerais" = sem requiredModality.
                
                // Mas espere, "extensivo (composto por: EXTENSIVO, COM_MATERIAL e SEM_MATERIAL)"
                // A regra para Extensivo é: gerais + exclusivas de extensivo.
                
                // Se o texto é "verifique se o aluno é APROFUNDAMENTO e, caso seja, conte as alunas gerais e as exclusivas do aprofundamento", 
                // então ele NÃO conta as exclusivas de extensivo (que teriam requiredModality='extensivo').
                
                return false; 
            }
            
            // EXTENSIVO (qualquer variação)
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
        // Add data-id for progress tracking
        card.setAttribute('data-id', `${moduloId}.${assuntoIndex}`);

        // CALCULO DE TEMPO TOTAL (AULA + SUBAULAS)
        let totalMinutes = 0;
        const subs = aula.subAulas || aula.subaulas || [];
        
        let hasVideo = false;
        if (aula.vimeoId && aula.vimeoId.trim()) hasVideo = true;

        // Tempo da aula principal
        // Só conta se o usuário tiver acesso àquela modalidade/aula
        if (aula.duracao && typeof aula.duracao === 'number') {
            if (shouldCountTime(aula)) {
                totalMinutes += aula.duracao;
            }
        }

        // Tempo das subaulas
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

        // Definir texto de status/duração
        let statusText = '';
        if (!hasVideo) {
            statusText = '(Em manutenção)';
        } else {
            statusText = totalMinutes > 0 ? `(${totalMinutes}min)` : '';
        }

        const mat = aula.materiais || {};

        // Lógica de Material Teórico com suporte a requiredModality e Múltiplos Arquivos
        let rawTeorico = mat.teorico || mat.teoria;
        let teoricoUrl = null;
        let hasComplexTeoria = false;

        if (rawTeorico) {
            if (typeof rawTeorico === 'string') {
                teoricoUrl = rawTeorico;
            } else if (typeof rawTeorico === 'object') {
                // Caso antigo: um único arquivo com restrição de modalidade
                if (rawTeorico.requiredModality || rawTeorico.file || rawTeorico.url) {
                    const req = rawTeorico.requiredModality;
                    let visible = true;
                    if (req && !isAdmin) {
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
                    // Novo caso: Objeto com múltiplas chaves (pe_extensivo, pe_aprofundamento, etc.)
                    // Verifica se há pelo menos alguma chave relevante
                    if (rawTeorico.pe_extensivo || rawTeorico.pe_aprofundamento || rawTeorico.extensivo || rawTeorico.aprofundamento) {
                         // Se for ADMIN ou APROFUNDAMENTO, mostra modal com opções
                         if (isAdmin || userModality.includes('aprofundamento') || userModality.includes('integral')) {
                              hasComplexTeoria = true;
                         } else {
                              // Outros alunos abrem direto a versão extensivo (ou equivalente padrão)

                              teoricoUrl = rawTeorico.pe_extensivo || rawTeorico.extensivo;
                         }
                    }
                }
            }
        }

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
                        <a href="${teoricoUrl ? `/pdf-viewer/viewer.html?doc=${encodeURIComponent(teoricoUrl)}` : '#'}" target="_blank" class="${hasComplexTeoria ? 'btn-complex-teoria' : ''}">
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
                                <span class="item-title">Para Praticar</span>
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
                if (it.href) window.open(it.href, '_blank');
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
        
        if (text.includes('lista') || text.includes('praticar')){
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
                   const hasExtra2 = listas.extra2;
                   const hasCongMod = listas.cong_mod;
                   
                   const items = [];

                   // Se for ADMIN, mostrar tudo
                   if (isAdmin || modality === 'INTEGRAL') {
                         if (hasExtensivo) items.push({ label: 'Praticando ENEM (Extensivo)', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(hasExtensivo)}` });
                         if (hasAprof) items.push({ label: 'Praticando ENEM (Aprofundamento)', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(hasAprof)}` });
                         
                         // Se não tiver nenhum dos dois cadastrado, fallback
                         if (!hasExtensivo && !hasAprof) {
                             items.push({ label: 'Praticando ENEM', href: 'questoes.html?lista=praticando-enem' });
                         }

                         if (hasCongMod) items.push({ label: 'Congruência Modular', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(hasCongMod)}` });

                         if (hasExtra) items.push({ label: 'Lista Extra', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(hasExtra)}` });
                         else items.push({ label: 'Lista Extra', href: 'questoes.html?lista=lista-extra' });

                         if (hasExtra2) items.push({ label: 'Lista Extra 2', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(hasExtra2)}` });

                         openModal('Para Praticar', items);
                         return;
                   }

                   // SEPARAÇÃO SOLICITADA PARA ALUNOS
                   // Se o aluno for APROFUNDAMENTO, ele vê as duas opções separadas se existirem? 
                   // Ou se ele for EXTENSIVO ele vê só a extensiva?
                   // Assumindo que aprofundamento -> Vê Aprofundamento E Extensivo (como opções separadas)
                   // EXTENSIVO -> Vê Extensivo
                   
                   if (modality === 'APROFUNDAMENTO') {
                       if (hasAprof) {
                           items.push({ label: 'Praticando ENEM', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(hasAprof)}` });
                       } else {
                           // Fallback genérico se aluno Aprofundamento não tem PDF Aprofundamento cadastrado
                           // Se não há aprofundamento, tentamos dar algo genérico
                           items.push({ label: 'Praticando ENEM', href: 'questoes.html?lista=praticando-enem' });
                       }

                   } else {
                       // Alunos EXTENSIVO ou outros
                       if (hasExtensivo) items.push({ label: 'Praticando ENEM', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(hasExtensivo)}` });
                       else items.push({ label: 'Praticando ENEM', href: 'questoes.html?lista=praticando-enem' });
                   }

                   // Congruencia Modular (Assumindo disponivel pra todos ou aprofundamento? 
                   // A aula era requiredModality: "aprofundamento". Vamos assumir para todos por enquanto se estava em extra antes, ou seguir a logica, mas vou colocar para todos como lista extra)
                   if (hasCongMod) {
                        items.push({ label: 'Congruência Modular', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(hasCongMod)}` });
                   }

                   // Lista Extra (sempre disponível)
                   if (hasExtra) {
                       items.push({ label: 'Lista Extra', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(hasExtra)}` });
                   } else {
                       items.push({ label: 'Lista Extra', href: 'questoes.html?lista=lista-extra' });
                   }

                   // Lista Extra 2
                   if (hasExtra2) {
                       items.push({ label: 'Lista Extra 2', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(hasExtra2)}` });
                   }

                   openModal('Para Praticar', items);
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
                        if (gabs.cong_mod) items.push({ label: 'Gabarito - Congruência Modular', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(gabs.cong_mod)}` });
                        if (gabs.extra) items.push({ label: 'Gabarito Extra', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(gabs.extra)}` });
                        if (gabs.extra2) items.push({ label: 'Gabarito Extra 2', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(gabs.extra2)}` });
                        
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

                    if (gabs.cong_mod) {
                        items.push({ label: 'Gabarito - Congruência Modular', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(gabs.cong_mod)}` });
                    }

                    // Extra
                    if (gabs.extra) {
                         items.push({ label: 'Gabarito Extra', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(gabs.extra)}` });
                    } else {
                         items.push({ label: 'Lista extra', href: 'questoes.html?gabarito=lista-extra' });
                    }

                    if (gabs.extra2) {
                         items.push({ label: 'Gabarito Extra 2', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(gabs.extra2)}` });
                    }

                    openModal('Gabaritos', items);
                })();
            });
        }
        
        if (text.includes('material teórico') || text.includes('ler resumo')) {
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
                   const modality = user && (user.modality || '').toUpperCase();
                   const isAdmin = user && String(user.status).toUpperCase() === 'ADMIN';

                   const mat = aula.materiais || {};
                   const rawTeorico = mat.teorico || mat.teoria || {};
                   
                   const items = [];

                   // Helper para adicionar item
                   const add = (label, url) => {
                       if (url) items.push({ label, href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(url)}` });
                   };

                   if (isAdmin) {
                        add('Teoria (Extensivo)', rawTeorico.pe_extensivo || rawTeorico.extensivo);
                        add('Teoria (Aprofundamento)', rawTeorico.pe_aprofundamento || rawTeorico.aprofundamento);
                        // Suporte a extra se houver futuro
                        if (rawTeorico.extra) add('Teoria Extra', rawTeorico.extra);
                        
                        if (items.length > 0) openModal('Material Teórico', items);
                        return;
                   }

                   // Alunos
                   // Extensivo sempre disponível se existir
                   const extUrl = rawTeorico.pe_extensivo || rawTeorico.extensivo;
                   const aprofUrl = rawTeorico.pe_aprofundamento || rawTeorico.aprofundamento;

                   // Todos veem extensivo (base) - ou discute-se se aprofundamento substitui
                   // Vou assumir que Aprofundamento vê AMBOS
                   if (extUrl) {
                       add('Teoria', extUrl);
                   }

                   if ((modality === 'APROFUNDAMENTO' || modality === 'INTEGRAL') && aprofUrl) {
                       add('Teoria (Aprofundamento)', aprofUrl);
                   }

                   if (items.length > 0) {
                       openModal('Material Teórico', items);
                   } else {
                       // Caso de fallback (se clicou e não tem nada, mas deveria estar hidden se não tivesse)
                       // Mas se for direct link falhando...
                   }

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

    async function loadProgress(){
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
                        // User request: "soma de todas as aulas/subaulas"
                        // Does main 'aula' count if it has subaulas?
                        // Usually main container is separate.
                        // If checking dados_aulas, some 'aulas' have main video (vimeoId).
                        // If vimeoId exists, count it?
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
