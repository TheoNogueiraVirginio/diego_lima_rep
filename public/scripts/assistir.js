document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    let idCombinado = params.get('id') || '1.1';

    // suporte a ids compostos: 1.1 ou 1.1.2 (módulo.assunto.sub)
    const idParts = String(idCombinado).split('.');
    const moduloNum = Number(idParts[0]) || 1;
    const assuntoNum = Number(idParts[1]) || 1;
    const subNum = idParts.length >= 3 ? Number(idParts[2]) : null;

    const data = window.cursoData || {};
    const mod = data && data[moduloNum];
    const tituloPrincipal = document.getElementById('class-title');
    const playerIframe = document.getElementById('video-player');
    const sidebarList = document.getElementById('upcoming-classes');

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
    try {
        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
        if (meRes && meRes.ok) {
            const me = await meRes.json();
            isAdmin = String(me?.status || '').toUpperCase().trim() === 'ADMIN';
        }
    } catch (e) {
        // ignorar erros; isAdmin permanece false
    }

    let subAula = null;
    if (assunto && assunto.subAulas && subNum) {
        const candidate = assunto.subAulas[subNum - 1];
        if (candidate && !(candidate.adminOnly && !isAdmin)) subAula = candidate;
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

    function setPlayerTo(vimeoId, title, newId) {
        if (!playerIframe) return;
        const vid = String(vimeoId || '').trim();
        idCombinado = newId;
        // update URL and title
        window.history.pushState({}, '', `assistir.html?id=${newId}`);
        if (title) tituloPrincipal.innerText = mod.tituloModulo + ' - ' + title;

        // set iframe src and attributes
        playerIframe.src = vid ? `https://player.vimeo.com/video/${vid}?badge=0&autopause=0&player_id=0&app_id=58479` : '';
        playerIframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share');
        playerIframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        playerIframe.title = title || 'Aula';

        // recreate vimeo player and listeners
        cleanupPlayer();
        try {
            // eslint-disable-next-line no-undef
            if (typeof Vimeo !== 'undefined' && vid) {
                vimeoPlayer = new Vimeo.Player(playerIframe);
                attachPlayerListeners(vimeoPlayer);
            }
        } catch (e) {
            console.warn('Vimeo Player not available', e);
            vimeoPlayer = null;
        }

        updateFinishButtonFor(newId);
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
                if (s.adminOnly && !isAdmin) return; // pular se somente admin
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
            const firstVisibleIndex = assunto.subAulas ? assunto.subAulas.findIndex(s => !(s.adminOnly && !isAdmin)) : -1;
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
                const body = { lessonId: idCombinado, status: 'COMPLETED', watchedSeconds: 0 };
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