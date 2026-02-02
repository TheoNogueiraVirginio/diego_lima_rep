document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    let idCombinado = params.get('id') || '1.1';

    // Parsear ID combinado (ex: "1.2" -> modulo=1, assunto=2)
    const [moduloNum, assuntoNum] = idCombinado.split('.').map(Number);

    const data = window.cursoData;
    const mod = data && data[moduloNum];
    const assunto = mod && mod.aulas && mod.aulas[assuntoNum - 1];
    
    const tituloPrincipal = document.getElementById('class-title');
    const playerVideo = document.getElementById('video-player');
    const sidebarList = document.getElementById('upcoming-classes');

    sidebarList.innerHTML = '';

    if (!mod) {
        tituloPrincipal.textContent = 'Módulo não encontrado';
        sidebarList.innerHTML = '<li class="lesson-card">Módulo não encontrado</li>';
        return;
    }

    // Título combina o módulo com o assunto selecionado
    const tituloAssunto = assunto ? assunto.titulo : 'Assunto não encontrado';
    tituloPrincipal.innerText = mod.tituloModulo + ' - ' + tituloAssunto;

    // --- Vimeo player integration: set iframe.src and attach SDK listeners ---
    const playerIframe = document.getElementById('video-player');
    let vimeoPlayer = null;
    if (assunto && assunto.vimeoId && playerIframe) {
        const vid = String(assunto.vimeoId).trim();
        // keep the same params as your example; do not autoplay by default
        playerIframe.src = `https://player.vimeo.com/video/${vid}?badge=0&autopause=0&player_id=0&app_id=58479`;
        playerIframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share');
        playerIframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        playerIframe.title = assunto.titulo || 'Aula';

        try {
            // eslint-disable-next-line no-undef
            vimeoPlayer = new Vimeo.Player(playerIframe);
        } catch (e) {
            // Vimeo global not available or error creating player
            console.warn('Vimeo Player not available', e);
            vimeoPlayer = null;
        }
    }

    // If a specific assunto was requested, show only that assunto in the sidebar
    if (assunto) {
        const a = assunto;
        const idx = assuntoNum - 1;
        const li = document.createElement('li');
        li.className = 'lesson-card';
        li.textContent = a.titulo;
        const thisId = `${moduloNum}.${idx + 1}`;
        li.dataset.index = idx;
        li.dataset.id = thisId;
        li.classList.add('active');

        li.addEventListener('click', () => {
            // keep single item active
            li.classList.add('active');
            const novoId = thisId;
            idCombinado = novoId;
            window.history.pushState({}, '', `assistir.html?id=${novoId}`);
            tituloPrincipal.innerText = mod.tituloModulo + ' - ' + a.titulo;
            updateFinishButtonFor(novoId);
        });

        sidebarList.appendChild(li);
        // TODO: in future, load sub-assuntos here as children of this assunto
    } else {
        // fallback: list all assuntos
        mod.aulas.forEach((a, idx) => {
            const li = document.createElement('li');
            li.className = 'lesson-card';
            li.textContent = a.titulo;
            const thisId = `${moduloNum}.${idx + 1}`;
            li.dataset.index = idx;
            li.dataset.id = thisId;
            li.addEventListener('click', () => {
                document.querySelectorAll('#upcoming-classes .lesson-card').forEach(x => x.classList.remove('active'));
                li.classList.add('active');
                idCombinado = thisId;
                window.history.pushState({}, '', `assistir.html?id=${thisId}`);
                tituloPrincipal.innerText = mod.tituloModulo + ' - ' + a.titulo;
                updateFinishButtonFor(thisId);
            });
            sidebarList.appendChild(li);
        });
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
            // reset state while checking
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

    // send progress to backend periodically and on ended
    if (vimeoPlayer) {
        let lastSentAt = 0;
        let lastReportedSeconds = 0; // latest seconds from player
        let lastSentRecordedSeconds = 0; // last seconds we successfully sent to server

        vimeoPlayer.on('timeupdate', (data) => {
            // data.seconds
            lastReportedSeconds = Math.floor(data.seconds || 0);
            const now = Date.now();

            // Only attempt send if at least 10s passed since last attempt
            if (now - lastSentAt < 10000) return;
            // Only persist when user advanced at least 15s since last recorded sent value
            if (lastReportedSeconds - lastSentRecordedSeconds < 15) return;

            lastSentAt = now;
            lastSentRecordedSeconds = lastReportedSeconds;

            // send watchedSeconds as IN_PROGRESS
            (async () => {
                try {
                    const res = await fetch('/api/progress/lesson', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ lessonId: idCombinado, watchedSeconds: lastReportedSeconds, status: 'IN_PROGRESS' })
                    });
                    if (!res.ok) {
                        // if send failed, rollback lastSentRecordedSeconds so we retry later
                        lastSentRecordedSeconds = Math.max(0, lastSentRecordedSeconds - 15);
                    }
                } catch (e) {
                    // ignore network errors and allow retry later
                    lastSentRecordedSeconds = Math.max(0, lastSentRecordedSeconds - 15);
                }
            })();
        });

        vimeoPlayer.on('ended', async () => {
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

        // on unload, try to persist latest watchedSeconds (use lastSentRecordedSeconds if available)
        window.addEventListener('beforeunload', (ev) => {
            try {
                const sendSeconds = lastSentRecordedSeconds || lastReportedSeconds;
                if (!sendSeconds) return;
                const payload = JSON.stringify({ lessonId: idCombinado, watchedSeconds: sendSeconds, status: 'IN_PROGRESS' });
                if (navigator.sendBeacon) {
                    navigator.sendBeacon('/api/progress/lesson', payload);
                } else {
                    // best-effort synchronous XHR as fallback
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', '/api/progress/lesson', false);
                    xhr.setRequestHeader('Content-Type', 'application/json');
                    try { xhr.send(payload); } catch (e) {}
                }
            } catch (e) {}
        });
    }

    // initial load of completedSet and button state, and attach listener
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
                // update local set and UI
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