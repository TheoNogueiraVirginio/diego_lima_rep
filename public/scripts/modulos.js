document.addEventListener('DOMContentLoaded', () => {
    const nomeSalvo = localStorage.getItem('nomeAluno');
    const elementoNome = document.getElementById('nome-aluno');

    if (nomeSalvo && elementoNome) {
        const primeiroNome = nomeSalvo.split(' ')[0].toLowerCase();
        const primeiroNomeOrganizado = primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1);
        elementoNome.textContent = primeiroNomeOrganizado;
    }

    // se veio de simulados bloqueado, mostrar modal central e remover flag
    try {
        const msg = localStorage.getItem('blockedSimuladosMessage');
        if (msg) {
            // criar overlay modal similar ao que existia em simulados.html
            const overlay = document.createElement('div');
            overlay.id = 'simulados-block-overlay';
            overlay.style.position = 'fixed';
            overlay.style.inset = '0';
            overlay.style.background = 'linear-gradient(180deg, rgba(2,6,90,0.6), rgba(2,6,90,0.85))';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.zIndex = '9999';

            const box = document.createElement('div');
            box.style.maxWidth = '680px';
            box.style.margin = '24px';
            box.style.background = 'linear-gradient(180deg, rgba(17,24,39,0.98), rgba(24,32,51,0.98))';
            box.style.border = '1px solid rgba(255,255,255,0.06)';
            box.style.padding = '28px';
            box.style.borderRadius = '12px';
            box.style.textAlign = 'center';
            box.style.color = 'white';

            const title = document.createElement('h2');
            title.textContent = 'Atenção';
            title.style.marginTop = '0';

            const p = document.createElement('p');
            p.textContent = msg;
            p.style.margin = '12px 0 20px 0';

            const btn = document.createElement('button');
            btn.textContent = 'Ir para Meus Módulos';
            btn.style.padding = '10px 16px';
            btn.style.borderRadius = '8px';
            btn.style.border = 'none';
            btn.style.background = 'linear-gradient(90deg,#2d6cdf,#1fb6a6)';
            btn.style.color = 'white';
            btn.style.cursor = 'pointer';
            btn.addEventListener('click', () => {
                overlay.remove();
            });

            box.appendChild(title);
            box.appendChild(p);
            box.appendChild(btn);
            overlay.appendChild(box);

            document.body.appendChild(overlay);

            localStorage.removeItem('blockedSimuladosMessage');
        }
    } catch (e) {
        // ignore
    }

    const modulos = document.querySelectorAll('.modulo');

    modulos.forEach(modulo => {
        modulo.addEventListener('click', (e) => {
            e.preventDefault();
            const moduloId = modulo.getAttribute('data-id');
            
            // --- TRAVA DE MÓDULOS (Lógica de Fachada) ---
            // Apenas para não-admins
            const userStatus = localStorage.getItem('userStatus');
            const isAdmin = (userStatus === 'ADMIN');
            
            if (!isAdmin && ['3','4',5,6].includes(moduloId)) {
                // Exibir mensagem de bloqueio fake
                showBlockModal();
                return;
            }
            // --------------------------------------------

            // Redirecionar para a página de materiais do módulo
            window.location.href = `materiais.html?id=${moduloId}`;
        });
    });

    function showBlockModal() {
        // Remove overlay existente se houver
        const existing = document.getElementById('module-lock-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'module-lock-overlay';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.background = 'linear-gradient(180deg, rgba(2,6,90,0.8), rgba(2,6,90,0.95))';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '99999';

        const box = document.createElement('div');
        box.style.maxWidth = '480px';
        box.style.margin = '20px';
        box.style.background = '#1a2233'; // Cor escura coerente com o tema
        box.style.border = '1px solid rgba(255,255,255,0.1)';
        box.style.padding = '32px';
        box.style.borderRadius = '16px';
        box.style.textAlign = 'center';
        box.style.color = 'white';
        box.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';

        const icon = document.createElement('div');
        icon.innerHTML = '🔒';
        icon.style.fontSize = '40px';
        icon.style.marginBottom = '16px';

        const title = document.createElement('h3');
        title.textContent = 'Módulo Bloqueado';
        title.style.fontSize = '1.5rem';
        title.style.marginBottom = '12px';
        title.style.color = '#fff';

        const p = document.createElement('p');
        p.textContent = 'Para prosseguir, é necessário concluir as atividades pendentes do Módulo 1.';
        p.style.color = '#cbd5e1';
        p.style.lineHeight = '1.5';
        p.style.marginBottom = '24px';

        const btn = document.createElement('button');
        btn.textContent = 'Entendi, voltar';
        btn.style.padding = '12px 24px';
        btn.style.borderRadius = '8px';
        btn.style.border = 'none';
        btn.style.fontWeight = '600';
        btn.style.background = 'linear-gradient(90deg, #3b82f6, #06b6d4)';
        btn.style.color = 'white';
        btn.style.cursor = 'pointer';
        btn.style.fontSize = '1rem';
        btn.style.transition = 'opacity 0.2s';
        
        btn.addEventListener('mouseover', () => btn.style.opacity = '0.9');
        btn.addEventListener('mouseout', () => btn.style.opacity = '1');
        btn.addEventListener('click', () => {
            overlay.remove();
        });

        box.appendChild(icon);
        box.appendChild(title);
        box.appendChild(p);
        box.appendChild(btn);
        overlay.appendChild(box);

        document.body.appendChild(overlay);
    }

    /* ---------- Gestão de Mensagens Motivacionais (Badges / Marquee) ---------- */
    const motivationalTexts = [
        '4x nota máxima em 2024',
        '2x nota máxima em 2025',
        'Única nota máxima da Paraíba em 2022',
        'Aprenda com quem sabe',
        'Rumo à aprovação',

    ];

    let badgesInterval = null;
    let marqueeCreated = false;

    function initMessages() {
        checkScreenMode();
        window.addEventListener('resize', () => {
             // Debounce simples
             clearTimeout(window._resizeTimer);
             window._resizeTimer = setTimeout(checkScreenMode, 200);
        });
    }

    function checkScreenMode() {
        const isSmallScreen = window.innerWidth <= 1024; // Mudança: passou de 768 para 1024

        if (isSmallScreen) {
            destroyFloatingBadges();
            mountMarquee();
        } else {
            destroyMarquee();
            mountFloatingBadges();
        }
    }

    // --- Lógica Marquee (Mobile) ---
    function mountMarquee() {
        if (marqueeCreated) return;
        
        const titleElement = document.querySelector('.titulo-modulos');
        if (!titleElement) return;

        // Container marquee
        const container = document.createElement('div');
        container.className = 'marquee-container';
        
        // Track (faixa que corre)
        const track = document.createElement('div');
        track.className = 'marquee-track';

        // Duplicar conteúdo para scroll infinito (pelo menos 4x para garantir cobrir telas largas se necessário)
        const contentStr = motivationalTexts.map(t => `<span class="marquee-item">${t}</span>`).join('');
        track.innerHTML = contentStr + contentStr + contentStr + contentStr;

        container.appendChild(track);
        
        // Inserir ANTES do título "Meus Módulos"
        titleElement.parentNode.insertBefore(container, titleElement);
        
        container.style.display = 'block';
        marqueeCreated = true;
    }

    function destroyMarquee() {
        const m = document.querySelector('.marquee-container');
        if (m) m.remove();
        marqueeCreated = false;
    }

    // --- Lógica Floating Badges (Desktop) ---
    function mountFloatingBadges() {
        const container = document.getElementById('floating-badges');
        if (!container) return; 

        // Mover para body para garantir posicionamento absoluto correto em relação à página
        if (container.parentElement !== document.body) {
            document.body.appendChild(container);
        }

        if (badgesInterval) return; // já rodando

        // Assegurar visibilidade caso tenha sido ocultado
        container.style.display = 'block';

        const status = document.querySelector('.status-container');
        const modulesWrap = document.querySelector('.modulos');
        if (!status || !modulesWrap) return;

        // Calcular layout
        function layoutContainer() {
            if (window.innerWidth <= 1024) return; // ignorar em mobile/tablet (1024px)
            const statusRect = status.getBoundingClientRect();
            
            // Usar window.scrollY para posição absoluta correta no body
            const top = Math.round(statusRect.bottom + window.scrollY + 6);
            
            // Usar innerWidth para evitar criar scroll horizontal
            const width = window.innerWidth; 
            
            // Altura até o final do documento
            const height = Math.max(document.body.scrollHeight - top, window.innerHeight - (statusRect.bottom + 6));

            container.style.position = 'absolute';
            container.style.left = '0px';
            container.style.top = top + 'px';
            container.style.width = width + 'px';
            container.style.height = height + 'px';
            container.style.pointerEvents = 'none';
        }
        
        layoutContainer();
        // Nota: O resize já chama checkScreenMode, que chama mountFloatingBadges se desktop
        // Mas se apenas redimensionar dentro de desktop, precisamos atualizar layout
        window.addEventListener('resize', layoutContainer); 

        const activeTexts = new Set();
        const activeBadgePositions = []; // {x, y}
        
        function moduleRectsRelative() {
            const contRect = container.getBoundingClientRect();
            // Alterado para usar o retângulo do wrapper inteiro (.modulos)
            // Isso garante que a área 'proibida' inclua os módulos E os espaços entre eles (gaps)
            const wRect = modulesWrap.getBoundingClientRect();
            return [{
                left: wRect.left - contRect.left,
                top: wRect.top - contRect.top,
                right: wRect.right - contRect.left,
                bottom: wRect.bottom - contRect.top
            }];
        }

        const BADGE_SAFE_W = 360; 
        const BADGE_SAFE_H = 90;

        function isOverlapping(bx, by, rects) {
            const bLeft = bx - BADGE_SAFE_W / 2;
            const bRight = bx + BADGE_SAFE_W / 2;
            const bTop = by - BADGE_SAFE_H / 2;
            const bBottom = by + BADGE_SAFE_H / 2;
            const pad = 20;

            return rects.some(r => {
                const mLeft = r.left - pad;
                const mRight = r.right + pad;
                const mTop = r.top - pad;
                const mBottom = r.bottom + pad;
                const overlapX = (bLeft < mRight) && (bRight > mLeft);
                const overlapY = (bTop < mBottom) && (bBottom > mTop);
                return overlapX && overlapY;
            });
        }

        function pickPositionAvoidingModules() {
            const contRect = container.getBoundingClientRect();
            const cw = contRect.width;
            const ch = contRect.height;
            const rects = moduleRectsRelative();
            
            const marginX = (BADGE_SAFE_W / 2) + 10;
            const marginY = (BADGE_SAFE_H / 2) + 10;
            
            if (cw < BADGE_SAFE_W) return { x: cw / 2, y: ch / 2, cw, ch };

            const minX = marginX;
            const maxX = cw - marginX;
            const minY = marginY;
            const maxY = Math.max(minY, ch - marginY);

            // Distância mínima (quadrada) entre badges para evitar aglomeração
            // Ex: 350px de distância => 350*350 = 122500
            const MIN_DIST_SQ = 350 * 350; 

            let attempts = 0;
            while (attempts < 100) {
                const x = minX + Math.random() * (maxX - minX);
                const y = minY + Math.random() * (maxY - minY);
                
                // 1. Evitar sobreposição com módulos
                if (isOverlapping(x, y, rects)) {
                    attempts++;
                    continue;
                }

                // 2. Evitar proximidade com outras badges ativas
                const tooClose = activeBadgePositions.some(p => {
                    const dx = x - p.x;
                    const dy = y - p.y;
                    return (dx * dx + dy * dy) < MIN_DIST_SQ;
                });

                if (!tooClose) {
                    return { x, y, cw, ch };
                }
                
                attempts++;
            }
            // Se não encontrou lugar seguro após tentativas, retorna null para não exibir em local proibido
            return null;
        }

        function createBadge(text) {
            if (activeTexts.has(text)) return;
            // Se estiver em modo mobile/tablet, abortar criaçao (segurança extra)
            if (window.innerWidth <= 1024) return;

            const pos = pickPositionAvoidingModules();
            if (!pos) return; // Não encontrou espaço válido
            
            // Registrar posição usada
            const posObj = { x: pos.x, y: pos.y };
            activeBadgePositions.push(posObj);

            const leftPerc = ((pos.x / pos.cw) * 100).toFixed(2) + '%';
            const topPerc = ((pos.y / pos.ch) * 100).toFixed(2) + '%';

            const el = document.createElement('div');
            el.className = 'floating-badge';
            el.setAttribute('aria-hidden', 'true');
            el.textContent = text;

            const delay = (Math.random() * 4).toFixed(2) + 's';
            const duration = (5 + Math.random() * 9).toFixed(2) + 's';
            const scale = (0.9 + Math.random() * 0.4).toFixed(2);

            el.style.left = leftPerc;
            el.style.top = topPerc;
            el.style.setProperty('--delay', delay);
            el.style.setProperty('--d', duration);
            el.style.setProperty('--s', scale);

            container.appendChild(el);
            activeTexts.add(text);

            const lifeMs = Math.round((parseFloat(duration) + 1) * 1000);
            setTimeout(() => {
                try { el.remove(); } catch (e) {}
                activeTexts.delete(text);
                // Remover posição do registro
                const idx = activeBadgePositions.indexOf(posObj);
                if (idx > -1) activeBadgePositions.splice(idx, 1);
            }, lifeMs + 1200);
        }

        // Inicial
        const uniqueTexts = Array.from(new Set(motivationalTexts));
        const initialCount = Math.min(uniqueTexts.length, 6);
        for (let i = 0; i < initialCount; i++) {
            createBadge(uniqueTexts[i % uniqueTexts.length]);
        }

        // Loop
        badgesInterval = setInterval(() => {
            if (window.innerWidth <= 1024) return; 
            const pool = Array.from(new Set(motivationalTexts));
            const available = pool.filter(t => !activeTexts.has(t));
            if (available.length === 0) return;
            const pick = available[Math.floor(Math.random() * available.length)];
            createBadge(pick);
        }, 2800 + Math.random() * 2200);

        // Salvar referência cleanup
        container._cleanup = () => {
            clearInterval(badgesInterval);
            badgesInterval = null;
            container.innerHTML = '';
            // Remove listener de resize específico dessa função ao destruir
            window.removeEventListener('resize', layoutContainer);
        };
    }

    function destroyFloatingBadges() {
        const container = document.getElementById('floating-badges');
        if (container && container._cleanup) {
            container._cleanup();
        }
        if (container) container.style.display = 'none';
        badgesInterval = null;
    }

    initMessages();

});
