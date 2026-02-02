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