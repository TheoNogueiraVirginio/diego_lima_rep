document.addEventListener('DOMContentLoaded', () => {
    // preencher nome do aluno
    const nomeSalvo = localStorage.getItem('nomeAluno');
    const elementoNome = document.getElementById('nome-aluno');

    if (nomeSalvo && elementoNome) {
        const primeiroNome = nomeSalvo.split(' ')[0].toLowerCase();
        const primeiroNomeOrganizado = primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1);
        elementoNome.textContent = primeiroNomeOrganizado;
    }

    const botoes = document.querySelectorAll('.btn-fazer-simulado');

    // comportamento padrão dos botões (será desabilitado caso necessário)
    botoes.forEach(botao => {
        botao.addEventListener('click', () => {
            if (botao.disabled) return;
            const idSimulado = botao.getAttribute('data-id');
            window.location.href = `questoes.html?id=${idSimulado}`;
        });
    });

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

    (async () => {
        const admin = await isAdmin();
        if (admin) return; // admin sempre pode acessar

        const completed = await hasCompletedModule();
        if (!completed) {
            redirectBlocked();
        }
    })();

});