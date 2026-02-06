function carregarNavbar() {
    // Intercept fetch to handle 401 globally: show blocking overlay and redirect to login after 5s
    (function installFetchInterceptor(){
        if (!window._fetchInterceptorInstalled) {
            const _origFetch = window.fetch.bind(window);
            window.fetch = async function(...args){
                try {
                    const res = await _origFetch(...args);
                    if (res && res.status === 401) {
                        handleUnauthorized();
                    }
                    return res;
                } catch (e) {
                    throw e;
                }
            };
            window._fetchInterceptorInstalled = true;
        }
    })();

    // Handle unauthorized: show overlay, block UI and redirect to login after 5s
    function handleUnauthorized(){
        try {
            if (document.getElementById('auth-block-overlay')) return; // already shown
            const allowed = ['/', '/index.html', '/login.html', '/cadastro.html'];
            const path = window.location.pathname || '/';

            // If current path is allowed, do nothing (user can stay on public pages)
            const isAllowed = allowed.includes(path);

            // Create overlay to block UI if not allowed
            if (!isAllowed) {
                const overlay = document.createElement('div');
                overlay.id = 'auth-block-overlay';
                overlay.style.position = 'fixed';
                overlay.style.left = '0';
                overlay.style.top = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.background = 'rgba(0,0,0,0.7)';
                overlay.style.color = 'white';
                overlay.style.display = 'flex';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.zIndex = '99999';
                overlay.style.flexDirection = 'column';
                overlay.innerHTML = `<div style="max-width:90%;text-align:center;"><h2>Sessão expirada</h2><p>Você será redirecionado para o login em <span id="auth-redirect-count">3</span> segundos.</p></div>`;
                document.body.appendChild(overlay);

                let t = 3;
                const counter = document.getElementById('auth-redirect-count');
                const iv = setInterval(()=>{
                    t--; if (counter) counter.textContent = String(t);
                    if (t <= 0) { clearInterval(iv); window.location.href = '/login.html'; }
                }, 1000);
            }
        } catch (e) {
            console.error('handleUnauthorized error', e);
            try { window.location.href = '/login.html'; } catch(e){}
        }
    }

    // 1. O HTML da sua Navbar (Copiado do seu código)
    const navbarHTML = `
    <nav class="navbar">
        <div class="diego">
            <img src="images/logo_diego.png" class="logo" alt="">
            <h3 style="color: white; margin-left: 20px; font-weight: 700; font-size: 24px;">Diego Lima Matemática</h3>
        </div>
        
        <button class="nav-toggle" aria-label="Abrir menu">☰</button>

        <div class="pgs">
            <a href="/modulos.html">Modulos</a>
            <a href="/simulados.html">Simulados</a>
            <a href="/informes.html">Informes</a>
        </div>

        <div class="user">
            <img id="profile-avatar" src="/images/white_user.png" alt="Perfil" class="logo" style="margin-right: 20px; cursor:pointer;">
            <div class="profile-menu" aria-hidden="true">
                    <div class="profile-name">Carregando...</div>
                    <div class="profile-sep"></div>
                    <a href="/monitoramento.html" class="menu-item admin-item" style="display:none;">Alunos</a>
                    <button class="menu-item btn-logout">Sair</button>
                    
            </div>
        </div>
    </nav> `;

    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
    destacarPaginaAtual();

    // Toggle do menu para telas pequenas
    const nav = document.querySelector('.navbar');
    const toggleBtn = document.querySelector('.nav-toggle');
    const pgs = document.querySelector('.pgs');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            nav.classList.toggle('open');
        });
    }

    // Perfil: abrir menu ao clicar no avatar
    const avatar = document.getElementById('profile-avatar');
    const profileMenu = document.querySelector('.profile-menu');

    function closeProfileMenu(){
        if (!profileMenu) return;
        profileMenu.style.display = 'none';
        profileMenu.setAttribute('aria-hidden', 'true');
    }

    function openProfileMenu(){
        if (!profileMenu) return;
        profileMenu.style.display = 'block';
        profileMenu.setAttribute('aria-hidden', 'false');
    }

    if (avatar && profileMenu) {
        avatar.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = profileMenu.getAttribute('aria-hidden') === 'false';
            if (isOpen) closeProfileMenu(); else openProfileMenu();
        });

        // fechar ao clicar fora
        document.addEventListener('click', (e) => {
            if (!profileMenu.contains(e.target) && e.target !== avatar) closeProfileMenu();
        });

        // preencher dados do usuário
        (async function loadUser(){
            try {
                const res = await fetch('/api/auth/me', { credentials: 'include' });
                let user = null;
                if (res.ok) user = await res.json();

                const nameEl = profileMenu.querySelector('.profile-name');
                if (user && user.name) {
                    nameEl.textContent = user.name;
                } else {
                    // fallback para localStorage
                    const nomeSalvo = localStorage.getItem('nomeAluno');
                    nameEl.textContent = nomeSalvo || 'Usuário';
                }

                // mostrar item "Alunos" apenas para usuários com status ADMIN
                const adminItem = profileMenu.querySelector('.admin-item');
                const statusNorm = String(user?.status || '').toUpperCase().trim();
                if (user && statusNorm === 'ADMIN') {
                    adminItem.style.display = '';
                }

                // bind logout button
                const logoutBtn = profileMenu.querySelector('.btn-logout');
                logoutBtn?.addEventListener('click', async () => {
                    try {
                        // Tentativa de logout via API (endpoint pode variar)
                        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
                    } catch(e){}
                    // limpando localStorage e redirecionando para login
                    try { localStorage.removeItem('nomeAluno'); } catch(e){}
                    window.location.href = '/login.html';
                });
            } catch (err) {
                // usar fallback
                const nameEl = profileMenu.querySelector('.profile-name');
                const nomeSalvo = localStorage.getItem('nomeAluno');
                nameEl.textContent = nomeSalvo || 'Usuário';
            }
        })();
    }

    // Fecha menu quando redimensiona para telas maiores
    window.addEventListener('resize', () => {
        if (window.innerWidth > 800 && nav.classList.contains('open')) {
            nav.classList.remove('open');
        }
    });
}


function destacarPaginaAtual() {
    const caminhoAtual = window.location.pathname
    const links = document.querySelectorAll('.pgs a')

    links.forEach(link => {
        // Pega o href do link (ex: /simulados.html)
        // O atributo getAttribute é melhor aqui para pegar o valor exato escrito no HTML
        const linkPath = link.getAttribute('href');

        // Verifica se a URL atual contém o link (ou é exatamente igual)
        if (caminhoAtual.includes(linkPath) && linkPath !== '/') {
            link.classList.add('active');
        } 
        // Caso especial para a Home se for apenas barra '/'
        else if (caminhoAtual === '/' && linkPath === '/') {
            link.classList.add('active')
        }
    });


    if (caminhoAtual === '/assistir.html') {
        links.forEach(link => link.classList.remove('active'));

        const modulosLink = document.querySelector('a[href="/modulos.html"]');
        if (modulosLink) modulosLink.classList.add('active');
    };
}


document.addEventListener('DOMContentLoaded', carregarNavbar);