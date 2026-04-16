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
            const res = await fetch('/api/simulado/simulado1/status', { credentials: 'include' });
            if (!res.ok) return;
            const data = await res.json();
            
            const label = document.getElementById('simulado-label-1');
            const valor = document.getElementById('simulado-valor-1');
            const barraContainer = document.getElementById('simulado-barra-container-1');
            const botaoFazer = document.querySelector('.btn-fazer-simulado[data-id="1"]');
            
            if (data.submitted) {
                if (label) label.textContent = 'Sua nota:';
                if (valor) {
                    valor.textContent = `${data.score}/${data.maxScore || 45}`;
                    valor.style.color = '#10b981'; // Garantir que a nota final continue verde se desejar
                }
                
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

                // Show the errors link and bind it
                const linkErros = document.getElementById('link-erros-1');
                if (linkErros) {
                    linkErros.style.display = 'block';
                    linkErros.addEventListener('click', (e) => {
                        e.preventDefault();
                        showErrorsModal('simulado1');
                    });
                }

            } else if (data.started) {
                if (botaoFazer) botaoFazer.textContent = 'Continuar Simulado';
                if (label) label.textContent = 'Você não realizou esse simulado';
                if (label) label.style.color = '#ff6b6b';
                if (valor) valor.style.display = 'none';
                if (barraContainer) {
                    barraContainer.style.display = 'none';
                }
            } else {
                if (label) label.textContent = 'Você não realizou esse simulado';
                if (label) label.style.color = '#ff6b6b';
                if (valor) valor.style.display = 'none';
                if (barraContainer) {
                    barraContainer.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Erro ao carregar status do simulado 1:', error);
        }
    }
    loadSimulado1Status();

    // Modal de questões erradas
    async function showErrorsModal(simuladoId) {
        try {
            const res = await fetch(`/api/simulado/${simuladoId}/results`, { credentials: 'include' });
            if (!res.ok) return;
            const data = await res.json();
            
            const wrongAnswers = (data.responses || []).filter(r => !r.isCorrect);

            const overlay = document.createElement('div');
            overlay.className = 'modal-erros-overlay';

            const box = document.createElement('div');
            box.className = 'modal-erros-box';

            const header = document.createElement('div');
            header.className = 'modal-erros-header';
            
            const title = document.createElement('h3');
            title.textContent = wrongAnswers.length > 0 ? 'Questões que você errou' : 'Você gabaritou tudo!';
            
            const btnClose = document.createElement('button');
            btnClose.className = 'btn-fechar-erros';
            btnClose.innerHTML = '&times;';
            btnClose.onclick = () => document.body.removeChild(overlay);

            header.appendChild(title);
            header.appendChild(btnClose);
            box.appendChild(header);

            if (wrongAnswers.length > 0) {
                // Ordenar por número da questão
                wrongAnswers.sort((a,b) => a.questionIndex - b.questionIndex);

                wrongAnswers.forEach(ans => {
                    const item = document.createElement('div');
                    item.className = 'erro-item';
                    
                    const qNum = document.createElement('p');
                    qNum.innerHTML = `<strong>Questão ${ans.questionIndex + 1}</strong>`;
                    
                    const youMarked = document.createElement('p');
                    youMarked.innerHTML = `Você marcou: <span style="color: #ef4444">${ans.selectedOption || 'Nenhuma'}</span>`;
                    
                    const correctIs = document.createElement('p');
                    correctIs.innerHTML = `Gabarito correto: <span style="color: #10b981">${ans.correctOption || '?'}</span>`;
                    
                    item.appendChild(qNum);
                    item.appendChild(youMarked);
                    item.appendChild(correctIs);
                    box.appendChild(item);
                });
            } else {
                const p = document.createElement('p');
                p.textContent = 'Parabéns, você não errou nenhuma questão!';
                p.style.color = '#10b981';
                box.appendChild(p);
            }

            overlay.appendChild(box);
            document.body.appendChild(overlay);

        } catch (error) {
            console.error('Erro ao buscar resultados do simulado:', error);
            alert('Não foi possível carregar as questões erradas no momento.');
        }
    }

});