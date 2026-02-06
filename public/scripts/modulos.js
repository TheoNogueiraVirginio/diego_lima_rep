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
            // Redirecionar para a página de materiais do módulo
            window.location.href = `materiais.html?id=${moduloId}`;
        });
    });

    /* ---------- Badges animadas de fundo (dinâmicas) ---------- */
    function createFloatingBadges() {
        const container = document.getElementById('floating-badges');
        const status = document.querySelector('.status-container');
        const modulesWrap = document.querySelector('.modulos');
        if (!container || !status || !modulesWrap) return;

        // mover o container para o <body> para cobrir toda a largura da página
        if (container.parentElement !== document.body) {
            document.body.appendChild(container);
        }

        const texts = [
            '4x nota máxima em 2024',
            '4x nota máxima em 2024',
            '4x nota máxima em 2024',
            '4x nota máxima em 2024',
            '2x nota máxima em 2025',
            '2x nota máxima em 2025',
            'Única nota máxima da Paraíba em 2022'
        ];

        // define área disponível: entre a base de status-container e a área dos módulos
        function layoutContainer() {
            const statusRect = status.getBoundingClientRect();
            const modulesRect = modulesWrap.getBoundingClientRect();

            // topo relativo ao documento (início abaixo de status-container)
            const top = Math.round(statusRect.bottom + window.scrollY + 6);
            const left = 0;
            const width = document.documentElement.scrollWidth || window.innerWidth;
            // altura até o final do conteúdo para permitir aparecer abaixo dos módulos
            const height = Math.max(document.body.scrollHeight - top, window.innerHeight - (statusRect.bottom + 6));

            container.style.position = 'absolute';
            container.style.left = left + 'px';
            container.style.top = top + 'px';
            container.style.width = Math.max(width, 120) + 'px';
            container.style.height = Math.max(height, 120) + 'px';
            container.style.pointerEvents = 'none';
        }

        layoutContainer();
        window.addEventListener('resize', layoutContainer);
        window.addEventListener('scroll', layoutContainer);

        const activeTexts = new Set();

        function moduleRectsRelative() {
            const contRect = container.getBoundingClientRect();
            return Array.from(modulesWrap.querySelectorAll('.modulo')).map(m => {
                const r = m.getBoundingClientRect();
                return {
                    left: r.left - contRect.left,
                    top: r.top - contRect.top,
                    right: r.right - contRect.left,
                    bottom: r.bottom - contRect.top
                };
            });
        }

        // Tamanho estimado máximo de uma badge para cálculo seguro de colisão e limites
        // Aumentado para lidar com textos longos e a animação vertical (translateY +/- 18px)
        const BADGE_SAFE_W = 360; 
        const BADGE_SAFE_H = 90;

        function isOverlapping(bx, by, rects) {
            // Badge bounds (centralizado em bx, by)
            const bLeft = bx - BADGE_SAFE_W / 2;
            const bRight = bx + BADGE_SAFE_W / 2;
            const bTop = by - BADGE_SAFE_H / 2;
            const bBottom = by + BADGE_SAFE_H / 2;

            const pad = 20; // margem extra de conforto visual em torno dos módulos

            return rects.some(r => {
                // Dimensões do módulo com padding
                const mLeft = r.left - pad;
                const mRight = r.right + pad;
                const mTop = r.top - pad;
                const mBottom = r.bottom + pad;

                // Verifica intersecção de retângulos
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
            
            // Define área 'segura' para o centro da badge, garantindo que ela não saia da tela
            // (Assumindo que o CSS centraliza com translate(-50%, -50%))
            const marginX = (BADGE_SAFE_W / 2) + 10;
            const marginY = (BADGE_SAFE_H / 2) + 10;
            
            // Se a tela for muito pequena, reduz margens ou centraliza
            if (cw < BADGE_SAFE_W) {
                return { x: cw / 2, y: ch / 2, cw, ch };
            }

            const minX = marginX;
            const maxX = cw - marginX;
            const minY = marginY;
            const maxY = Math.max(minY, ch - marginY);

            let attempts = 0;
            while (attempts < 50) {
                const x = minX + Math.random() * (maxX - minX);
                const y = minY + Math.random() * (maxY - minY);
                
                if (!isOverlapping(x, y, rects)) {
                    return { x, y, cw, ch };
                }
                attempts++;
            }
            // fallback: tenta não sair da tela, mesmo que sobreponha
            return { x: cw / 2, y: ch / 2, cw, ch };
        }

        function createBadge(text) {
            if (activeTexts.has(text)) return null; // não criar duplicata simultânea
            const pos = pickPositionAvoidingModules();
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
            }, lifeMs + 1200);

            return el;
        }

        // inicial: criar badges únicas (não duplicadas ao mesmo tempo)
        const uniqueTexts = Array.from(new Set(texts));
        const initialCount = window.innerWidth < 600 ? 3 : Math.min(uniqueTexts.length, 6);
        for (let i = 0; i < initialCount; i++) {
            const t = uniqueTexts[i % uniqueTexts.length];
            createBadge(t);
        }

        // spawn periódico — tenta criar uma nova badge única quando houver oportunidade
        setInterval(() => {
            const pool = Array.from(new Set(texts));
            const available = pool.filter(t => !activeTexts.has(t));
            if (available.length === 0) return;
            const pick = available[Math.floor(Math.random() * available.length)];
            createBadge(pick);
        }, 2800 + Math.random() * 2200);
    }

    createFloatingBadges();

});
