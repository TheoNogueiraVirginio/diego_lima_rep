document.addEventListener('DOMContentLoaded', () => {
    // preencher nome do aluno
    const nomeSalvo = localStorage.getItem('nomeAluno');
    const elementoNome = document.getElementById('nome-aluno');

    if (nomeSalvo && elementoNome) {
        const primeiroNome = nomeSalvo.split(' ')[0].toLowerCase();
        const primeiroNomeOrganizado = primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1);
        elementoNome.textContent = primeiroNomeOrganizado;
    }

    const botoes = document.querySelectorAll('.btn-fazer-simulado[data-id]');

    // comportamento dos botões de simulado
    botoes.forEach(botao => {
        botao.addEventListener('click', (e) => {
            if (botao.disabled) return;
            const idSimulado = botao.getAttribute('data-id');
            if (idSimulado == '1') {
                alert('Esse simulado não está mais disponível');
                return;
            }
            //lembrar de fazer para os outros simulados depois
            window.location.href = `questoes.html?id=${idSimulado}`;
        });
    });

    function showBlockModal() {
        // Remove overlay existente se houver
        const existing = document.getElementById('module-lock-overlay');
        if (existing) return; // Já está exibindo

        const overlay = document.createElement('div');
        overlay.id = 'module-lock-overlay';
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
        title.textContent = 'Acesso Bloqueado';
        title.style.fontSize = '1.5rem';
        title.style.marginBottom = '12px';
        title.style.color = '#fff';

        const p = document.createElement('p');
        p.textContent = 'Acesso restrito: por enquanto apenas administradores podem abrir este simulado.';
        p.style.color = '#cbd5e1';
        p.style.lineHeight = '1.5';
        p.style.marginBottom = '24px';

        const btn = document.createElement('button');
        btn.textContent = 'Voltar para Módulos';
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
            window.location.href = '/modulos.html';
        });

        box.appendChild(icon);
        box.appendChild(title);
        box.appendChild(p);
        box.appendChild(btn);
        overlay.appendChild(box);

        document.body.appendChild(overlay);
    }

    // verifica se o usuário é ADMIN
    async function isAdmin() {
        try {
            const res = await fetch('/api/auth/me', { credentials: 'include' });
            if (!res.ok) return false;
            const j = await res.json();
            if (j?.role && String(j.role).toLowerCase() === 'admin') return true;
            if (j?.roles && Array.isArray(j.roles) && j.roles.includes('ADMIN')) return true;
            if (j?.isAdmin) return true;
            return false;
        } catch (e) {
            return false;
        }
    }

    // verifica se existe ao menos 1 módulo concluído (tenta usar percent ou flag completed)
    async function hasCompletedModule() {
        try {
            const res = await fetch('/api/progress/summary/me', { credentials: 'include' });
            if (!res.ok) return false;
            const data = await res.json();
            const modules = data?.modules || [];
            for (const m of modules) {
                const percent = m?.percent ?? m?.averageScore ?? null;
                if (percent != null && Number(percent) >= 100) return true;
                if (m?.completed === true) return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    // redirecionamento imediato: grava mensagem e volta ao referer ou para módulos
    function redirectBlocked() {
        try {
            const message = 'Para acessar os simulados você precisa concluir ao menos 1 módulo.';
            localStorage.setItem('blockedSimuladosMessage', message);
        } catch (e) {
            // ignore
        }

        try {
            const ref = document.referrer;
            const sameOrigin = ref && (new URL(ref)).origin === window.location.origin;
            if (sameOrigin) {
                window.location.href = ref;
            } else {
                window.location.href = 'modulos.html';
            }
        } catch (e) {
            window.location.href = 'modulos.html';
        }
    }

    // O simulado 1 está liberado para todos os alunos.
    // Não bloqueamos mais o acesso para usuários não-admin.

    // Fetch simulado1 status and update UI
    async function loadSimulado1Status() {
        try {
            const res = await fetch('/api/simulados/simulado1/status', { credentials: 'include' });
            if (!res.ok) return;
            const data = await res.json();
            
            const label = document.getElementById('simulado-label-1');
            const valor = document.getElementById('simulado-valor-1');
            const barraContainer = document.getElementById('simulado-barra-container-1');
            const botaoFazer = document.querySelector('.btn-fazer-simulado[data-id="1"]');
            
            if (data.submitted) {
                if (label) label.textContent = 'Nota:';
                if (valor) valor.textContent = `${data.score} / ${data.maxScore || 45}`;
                
                // Hide progress bar as requested
                if (barraContainer) {
                    barraContainer.style.display = 'none';
                }
                
                if (botaoFazer) {
                    botaoFazer.textContent = 'Simulado Finalizado';
                    botaoFazer.disabled = true;
                    // Optional: add some styling for disabled state
                    botaoFazer.style.opacity = '0.7';
                    botaoFazer.style.cursor = 'not-allowed';
                }
            } else if (data.started) {
                if (botaoFazer) botaoFazer.textContent = 'Continuar Simulado';
            }
        } catch (error) {
            console.error('Erro ao carregar status do simulado 1:', error);
        }
    }
    loadSimulado1Status();

});