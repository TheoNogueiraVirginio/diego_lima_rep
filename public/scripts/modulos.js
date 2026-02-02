document.addEventListener('DOMContentLoaded', () => {
    const nomeSalvo = localStorage.getItem('nomeAluno');
    const elementoNome = document.getElementById('nome-aluno');

    if (nomeSalvo && elementoNome) {
        const primeiroNome = nomeSalvo.split(' ')[0].toLowerCase();
        const primeiroNomeOrganizado = primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1);
        elementoNome.textContent = primeiroNomeOrganizado;
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

        function isInsideAnyModule(x, y, rects) {
            return rects.some(r => {
                const pad = 20; // distância mínima das badges em relação aos módulos
                return x >= (r.left - pad) && x <= (r.right + pad) && y >= (r.top - pad) && y <= (r.bottom + pad);
            });
        }

        function pickPositionAvoidingModules() {
            const contRect = container.getBoundingClientRect();
            const cw = contRect.width;
            const ch = contRect.height;
            const rects = moduleRectsRelative();
            let attempts = 0;
            while (attempts < 40) {
                const x = 8 + Math.random() * Math.max(0, cw - 16);
                const y = 6 + Math.random() * Math.max(0, ch - 12);
                if (!isInsideAnyModule(x, y, rects)) {
                    return { x, y, cw, ch };
                }
                attempts++;
            }
            // fallback: center
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
