document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const idCombinado = params.get('id') || '1.1';

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

    // Lista todos os assuntos do módulo
    mod.aulas.forEach((a, idx) => {
        const li = document.createElement('li');
        li.className = 'lesson-card';
        li.textContent = a.titulo;
        li.dataset.index = idx;
        
        // Marcar como ativo o assunto selecionado
        if (idx === assuntoNum - 1) {
            li.classList.add('active');
        }

        li.addEventListener('click', () => {
            document.querySelectorAll('#upcoming-classes .lesson-card').forEach(x => x.classList.remove('active'));
            li.classList.add('active');
            
            // Atualizar URL e título ao clicar em outro assunto
            const novoId = `${moduloNum}.${idx + 1}`;
            window.history.pushState({}, '', `assistir.html?id=${novoId}`);
            tituloPrincipal.innerText = mod.tituloModulo + ' - ' + a.titulo;
            
            // carregar vídeo apenas se existir vimeoId
          /*if (a.vimeoId) {
                playerVideo.src = `https://player.vimeo.com/video/${a.vimeoId}`;
            }*/
        });

        sidebarList.appendChild(li);
    });
});