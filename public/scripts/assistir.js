document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    let idCombinado = params.get('id') || '1.1';

    // suporte a ids compostos: 1.1 ou 1.1.2 (módulo.assunto.sub)
    const idParts = String(idCombinado).split('.');
    const moduloNum = Number(idParts[0]) || 1;
    
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.href = `/materiais.html?id=${moduloNum}`;
    }
    
    const assuntoNum = Number(idParts[1]) || 1;
    const subNum = idParts.length >= 3 ? Number(idParts[2]) : null;

    const data = window.cursoData || {};
    const mod = data && data[moduloNum];
    const tituloPrincipal = document.getElementById('class-title');
    const playerIframe = document.getElementById('video-player');
    const sidebarList = document.getElementById('upcoming-classes');
    
    // --- Lógica de Comentários ---
    const commentInput = document.getElementById('comment-input');
    const submitCommentBtn = document.getElementById('submit-comment');

    if (submitCommentBtn) {
        submitCommentBtn.addEventListener('click', async () => {
            const content = commentInput.value;
            if (!content || !content.trim()) {
                alert('Por favor, escreva um comentário.');
                return;
            }

            // Desabilitar botão para evitar duplo clique
            submitCommentBtn.disabled = true;
            submitCommentBtn.innerText = 'Enviando...';

            try {
                const res = await fetch('/api/comments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lessonId: idCombinado, content: content.trim() })
                });

                if (res.ok) {
                    alert('Comentário particular enviado com sucesso!');
                    commentInput.value = '';
                } else {
                    alert('Erro ao enviar comentário. Tente novamente.');
                }
            } catch (e) {
                console.error(e);
                alert('Erro de conexão ao enviar comentário.');
            } finally {
                submitCommentBtn.disabled = false;
                submitCommentBtn.innerText = 'Enviar Comentário';
            }
        });
    }

    // --- Lógica "Ir para a prática" ---
    const practiceBtn = document.querySelector('.practice-button');
    if (practiceBtn) {
        practiceBtn.addEventListener('click', () => {
            if (!assunto) return;
            
            // Dados similares ao materiais.js
            const listas = (assunto.materiais && assunto.materiais.listas) || {};
            const hasExtensivo = listas.pe_extensivo;
            const hasAprof = listas.pe_aprofundamento;
            const hasExtra = listas.extra;
            const hasExtra2 = listas.extra2;
            
            const items = [];
            const userModUpper = userModality.toUpperCase();

            // Se for ADMIN, mostrar tudo
            if (isAdmin) {
                if (hasExtensivo) items.push({ label: 'Praticando ENEM (Extensivo)', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(hasExtensivo)}` });
                if (hasAprof) items.push({ label: 'Praticando ENEM (Aprofundamento)', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(hasAprof)}` });
                
                if (!hasExtensivo && !hasAprof) {
                    items.push({ label: 'Praticando ENEM', href: 'questoes.html?lista=praticando-enem' });
                }

                if (hasExtra) items.push({ label: 'Lista Extra', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(hasExtra)}` });
                else items.push({ label: 'Lista Extra', href: 'questoes.html?lista=lista-extra' });

                if (hasExtra2) items.push({ label: 'Lista Extra 2', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(hasExtra2)}` });

                openModal('Para Praticar', items);
                return;
            }

            // Lógica para Alunos
            if (userModUpper === 'APROFUNDAMENTO') { 
                // Aprofundamento vê APENAS o PDF de aprofundamento (se existir).
                if (hasAprof) {
                    items.push({ label: 'Praticando ENEM', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(hasAprof)}` });
                } else {
                    // Fallback se não tiver lista específica cadastrada
                    items.push({ label: 'Praticando ENEM', href: 'questoes.html?lista=praticando-enem' });
                }

            } else { 
                // Extensivo (e outros) vê apenas extensivo
                if (hasExtensivo) items.push({ label: 'Praticando ENEM', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(hasExtensivo)}` });
                else items.push({ label: 'Praticando ENEM', href: 'questoes.html?lista=praticando-enem' });
            }

            // Lista Extra (sempre disponível)
            if (hasExtra) {
                items.push({ label: 'Lista Extra', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(hasExtra)}` });
            } else {
                items.push({ label: 'Lista Extra', href: 'questoes.html?lista=lista-extra' });
            }

            if (hasExtra2) {
                items.push({ label: 'Lista Extra 2', href: `/pdf-viewer/viewer.html?doc=${encodeURIComponent(hasExtra2)}` });
            }

            openModal('Para Praticar', items);
        });
    }

    // Modal helper (versão simplificada/inline)
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
        setTimeout(() => {
            const first = bodyEl.querySelector('.modal-option');
            if (first) first.focus();
        }, 50);
    }

    sidebarList.innerHTML = '';

    if (!mod) {
        tituloPrincipal.textContent = 'Módulo não encontrado';
        sidebarList.innerHTML = '<li class="lesson-card">Módulo não encontrado</li>';
        return;
    }

    // localizar assunto e sub-aula (se existir)
    const assunto = mod.aulas && mod.aulas[assuntoNum - 1];
    // determinar se usuário é admin consultando o backend (/api/auth/me)
    let isAdmin = false;
    let userModality = '';
    try {
        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
        if (meRes && meRes.ok) {
            const me = await meRes.json();
            isAdmin = String(me?.status || '').toUpperCase().trim() === 'ADMIN';
            userModality = String(me?.modality || '').toLowerCase().trim();
        }
    } catch (e) {
        // ignorar erros; isAdmin permanece false
    }


    // Helper de visibilidade
    const isVisible = (item) => {
        if (!item) return false;
        if (isAdmin) return true;
        if (item.adminOnly) return false;

        if (userModality.includes('integral')) return true;

        if (item.requiredModality) {
            if (!userModality) return false; // Se tem requisito e usuário não tem modalidade, esconde
            const req = String(item.requiredModality).toLowerCase().trim();
            
            // "extensivo" inclui: extensivo, com_material, sem_material
            if (req === 'extensivo') {
                const validos = ['extensivo', 'com_material', 'sem_material'];
                return validos.some(v => userModality.includes(v));
            }
            
            // Para outros casos, verificação simples de inclusão
            if (!userModality.includes(req)) return false;
        }
        return true;
    };

    let subAula = null;
    if (assunto && assunto.subAulas && subNum) {
        const candidate = assunto.subAulas[subNum - 1];
        if (isVisible(candidate)) subAula = candidate;
    }

    // atualizar título principal
    if (assunto) {
        const tituloAssunto = assunto.titulo;
        if (subAula) {
            // se a aula principal estiver oculta na sidebar, mostrar apenas o título da sub-aula
            if (assunto.hideMainInSidebar) {
                tituloPrincipal.innerText = mod.tituloModulo + ' - ' + subAula.titulo;
            } else {
                tituloPrincipal.innerText = mod.tituloModulo + ' - ' + `${tituloAssunto} — ${subAula.titulo}`;
            }
        } else {
            tituloPrincipal.innerText = mod.tituloModulo + ' - ' + tituloAssunto;
        }
    } else {
        tituloPrincipal.innerText = mod.tituloModulo;
    }

    // Helper: reuso ao trocar vídeo
    let vimeoPlayer = null;
    let lastSentAt = 0;
    let lastReportedSeconds = 0;
    let lastSentRecordedSeconds = 0;

    function cleanupPlayer() {
        try {
            if (vimeoPlayer) {
                if (typeof vimeoPlayer.off === 'function') {
                    try { vimeoPlayer.off('timeupdate'); } catch (e) {}
                    try { vimeoPlayer.off('ended'); } catch (e) {}
                }
            }
        } catch (e) {}
        vimeoPlayer = null;
    }

    function attachPlayerListeners(player) {
        if (!player) return;
        player.on('timeupdate', (data) => {
            lastReportedSeconds = Math.floor(data.seconds || 0);
            const now = Date.now();
            if (now - lastSentAt < 10000) return;
            if (lastReportedSeconds - lastSentRecordedSeconds < 15) return;
            lastSentAt = now;
            lastSentRecordedSeconds = lastReportedSeconds;

            (async () => {
                try {
                    const res = await fetch('/api/progress/lesson', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ lessonId: idCombinado, watchedSeconds: lastReportedSeconds, status: 'IN_PROGRESS' })
                    });
                    if (!res.ok) {
                        lastSentRecordedSeconds = Math.max(0, lastSentRecordedSeconds - 15);
                    }
                } catch (e) {
                    lastSentRecordedSeconds = Math.max(0, lastSentRecordedSeconds - 15);
                }
            })();
        });

        player.on('ended', async () => {
            try {
                const res = await fetch('/api/progress/lesson', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lessonId: idCombinado, watchedSeconds: lastReportedSeconds || 0, status: 'COMPLETED' })
                });
                if (res.ok) {
                    completedSet.add(String(idCombinado));
                    updateFinishButtonFor(idCombinado);
                    if (window.loadProgress) window.loadProgress();
                }
            } catch (e) {
                console.error('Erro ao informar conclusão ao backend', e);
            }
        });
    }

    async function setPlayerTo(vimeoId, title, newId) {
        if (!playerIframe) return;
        
        // Reset progress tracking variables for the new video
        lastReportedSeconds = 0;
        lastSentRecordedSeconds = 0;
        lastSentAt = 0;

        const vid = String(vimeoId || '').trim();
        idCombinado = newId;

        // update URL and title
        window.history.pushState({}, '', `assistir.html?id=${newId}`);
        if (title) tituloPrincipal.innerText = mod.tituloModulo + ' - ' + title;

        // Tenta reutilizar player via loadVideo (mais estável)
        let loaded = false;
        if (vimeoPlayer && typeof vimeoPlayer.loadVideo === 'function' && vid) {
            try {
                await vimeoPlayer.loadVideo(vid);
                loaded = true;
                // Ao carregar novo vídeo, é bom garantir que os listeners estão ativos ou re-anexar se necessário.
                // Mas geralmente persistem. Se o vídeo começar a tocar, os eventos virão.
            } catch (err) {
                console.warn('Erro ao carregar vídeo via API, tentando recriar iframe...', err);
            }
        }

        if (!loaded) {
            recriaPlayer(vid, title);
        }

        updateFinishButtonFor(newId);
    }

    function recriaPlayer(vid, title) {
        // set iframe src and attributes manually
        playerIframe.src = vid ? `https://player.vimeo.com/video/${vid}?badge=0&autopause=0&player_id=0&app_id=58479` : '';
        playerIframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share');
        playerIframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        playerIframe.title = title || 'Aula';

        // recreate vimeo player and listeners
        cleanupPlayer();
        
        if (vid) {
            // Pequeno delay para garantir que o iframe carregou o novo src antes de anexar o SDK
            setTimeout(() => {
                try {
                    // eslint-disable-next-line no-undef
                    if (typeof Vimeo !== 'undefined') {
                        vimeoPlayer = new Vimeo.Player(playerIframe);
                        attachPlayerListeners(vimeoPlayer);
                    }
                } catch (e) {
                    console.warn('Erro ao instanciar Vimeo Player', e);
                    vimeoPlayer = null;
                }
            }, 800);
        }
    }

    // render sidebar: assunto principal + sub-aulas (se houver)
    if (assunto) {
        const idx = assuntoNum - 1;
        // Se a aula principal não deve aparecer na sidebar, pule sua renderização
        const mainId = `${moduloNum}.${idx + 1}`;
        const hideMain = !!assunto.hideMainInSidebar;
        if (!hideMain) {
            const mainLi = document.createElement('li');
            mainLi.className = 'lesson-card';
            mainLi.textContent = assunto.titulo;
            mainLi.dataset.id = mainId;
            mainLi.addEventListener('click', () => {
                document.querySelectorAll('#upcoming-classes .lesson-card').forEach(x => x.classList.remove('active'));
                mainLi.classList.add('active');
                setPlayerTo(assunto.vimeoId, assunto.titulo, mainId);
            });
            sidebarList.appendChild(mainLi);
        }

        if (assunto.subAulas && assunto.subAulas.length) {
            const subUl = document.createElement('ul');
            subUl.className = 'sub-lessons';
            // apenas renderizar sub-aulas visíveis para o usuário
            assunto.subAulas.forEach((s, sIdx) => {
                if (!isVisible(s)) return; // pular se não visível (adminOnly ou modalidade específica)
                const subLi = document.createElement('li');
                subLi.className = 'lesson-card sub';
                const subId = `${moduloNum}.${assuntoNum}.${sIdx + 1}`;
                subLi.dataset.id = subId;
                subLi.textContent = s.titulo;
                subLi.addEventListener('click', () => {
                    document.querySelectorAll('#upcoming-classes .lesson-card').forEach(x => x.classList.remove('active'));
                    subLi.classList.add('active');
                    const titleToUse = assunto.hideMainInSidebar ? s.titulo : `${assunto.titulo} — ${s.titulo}`;
                    setPlayerTo(s.vimeoId, titleToUse, subId);
                });
                subUl.appendChild(subLi);
            });
            // anexar somente se existir pelo menos uma sub-aula visível
            if (subUl.children.length) sidebarList.appendChild(subUl);
        }

        // marcar ativo inicial e escolher li inicial
        // se a aula principal estiver oculta, escolher a primeira sub-aula visível como inicial
        let initialLesson = null;
        let activeId = null;
        if (subAula) {
            initialLesson = subAula;
            activeId = `${moduloNum}.${assuntoNum}.${subNum}`;
        } else if (hideMain) {
            // procurar primeira sub-aula visível
            const firstVisibleIndex = assunto.subAulas ? assunto.subAulas.findIndex(s => isVisible(s)) : -1;
            if (firstVisibleIndex >= 0) {
                const s = assunto.subAulas[firstVisibleIndex];
                initialLesson = s;
                activeId = `${moduloNum}.${assuntoNum}.${firstVisibleIndex + 1}`;
            }
        } else {
            initialLesson = assunto;
            activeId = `${moduloNum}.${assuntoNum}`;
        }

        const toActivate = activeId ? sidebarList.querySelector(`[data-id='${activeId}']`) : null;
        if (toActivate) toActivate.classList.add('active');

        // iniciar player com a aula/sub-aula selecionada
        if (initialLesson && initialLesson.vimeoId) {
            let title;
            if (initialLesson === assunto) {
                title = assunto.titulo;
            } else {
                title = assunto.hideMainInSidebar ? initialLesson.titulo : `${assunto.titulo} — ${initialLesson.titulo}`;
            }
            setPlayerTo(initialLesson.vimeoId, title, activeId);
        }
    } else {
        // fallback: listar todas as aulas do módulo
        mod.aulas.forEach((a, idx) => {
            const li = document.createElement('li');
            li.className = 'lesson-card';
            li.textContent = a.titulo;
            const thisId = `${moduloNum}.${idx + 1}`;
            li.dataset.id = thisId;
            li.addEventListener('click', () => {
                document.querySelectorAll('#upcoming-classes .lesson-card').forEach(x => x.classList.remove('active'));
                li.classList.add('active');
                setPlayerTo(a.vimeoId, a.titulo, thisId);
            });
            sidebarList.appendChild(li);
        });

        // iniciar com a primeira aula por padrão
        const first = mod.aulas && mod.aulas[0];
        if (first) setPlayerTo(first.vimeoId, first.titulo, `${moduloNum}.1`);
    }

    // Botão de marcar como concluído
    const finishBtn = document.querySelector('.finished-video-button');
    let completedSet = new Set();

    async function loadCompletedSet(){
        try {
            const checkRes = await fetch('/api/progress/lessons/me', { credentials: 'include' });
            if (!checkRes.ok) return;
            const items = await checkRes.json();
            completedSet = new Set(items.filter(p => String(p.status).toUpperCase() === 'COMPLETED').map(p => String(p.lessonId)));
        } catch (e) {
            // ignore
        }
    }

    async function updateFinishButtonFor(lessonId){
        try {
            const btn = document.querySelector('.finished-video-button');
            if (!btn) return;
            btn.disabled = false;
            btn.textContent = 'Marcar como concluído';
            btn.classList.remove('done');

            if (!completedSet.size) await loadCompletedSet();
            if (completedSet.has(String(lessonId))) {
                btn.textContent = 'Concluído';
                btn.disabled = true;
                btn.classList.add('done');
            }
        } catch (err) {
            // ignore
        }
    }

    // on unload: tentar enviar o último progresso
    window.addEventListener('beforeunload', (ev) => {
        try {
            const sendSeconds = lastSentRecordedSeconds || lastReportedSeconds;
            if (!sendSeconds) return;
            const payload = JSON.stringify({ lessonId: idCombinado, watchedSeconds: sendSeconds, status: 'IN_PROGRESS' });
            if (navigator.sendBeacon) {
                navigator.sendBeacon('/api/progress/lesson', payload);
            } else {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/progress/lesson', false);
                xhr.setRequestHeader('Content-Type', 'application/json');
                try { xhr.send(payload); } catch (e) {}
            }
        } catch (e) {}
    });

    // initial load of completedSet and attach click for finish button
    if (finishBtn) {
        (async () => {
            await loadCompletedSet();
            updateFinishButtonFor(idCombinado);
        })();

        finishBtn.addEventListener('click', async () => {
            finishBtn.disabled = true;
            finishBtn.textContent = 'Marcando...';
            try {
                const body = { lessonId: idCombinado, status: 'COMPLETED', watchedSeconds: lastReportedSeconds || 0 };
                const res = await fetch('/api/progress/lesson', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                if (!res.ok) {
                    if (res.status === 401) {
                        if (window.showLoginBanner) window.showLoginBanner();
                        throw new Error('Unauthorized');
                    }
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || 'Falha ao marcar aula');
                }
                completedSet.add(String(idCombinado));
                finishBtn.textContent = 'Concluído';
                finishBtn.disabled = true;
                finishBtn.classList.add('done');
                if (window.loadProgress) window.loadProgress();
            } catch (e) {
                console.error('Erro ao marcar aula concluída', e);
                finishBtn.disabled = false;
                finishBtn.textContent = 'Marcar como concluído';
                alert('Não foi possível marcar como concluído. Verifique se está logado.');
            }
        });
    }
});