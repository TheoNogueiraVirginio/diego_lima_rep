document.addEventListener('DOMContentLoaded', () => {
    // preencher nome do aluno
    const nomeSalvo = localStorage.getItem('nomeAluno');
    const elementoNome = document.getElementById('nome-aluno');

    if (nomeSalvo && elementoNome) {
        const primeiroNome = nomeSalvo.split(' ')[0].toLowerCase();
        const primeiroNomeOrganizado = primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1);
        elementoNome.textContent = primeiroNomeOrganizado;
    }

    async function getUserModality() {
        try {
            const res = await fetch('/api/auth/me', { credentials: 'include' });
            if (!res.ok) return '';
            const user = await res.json();
            return String(user?.modality || '').trim();
        } catch (e) {
            return '';
        }
    }

    async function hideAprofundamentoSimuladoActions() {
        const modality = await getUserModality();
        if (!modality.toLowerCase().includes('aprofundamento')) return;

        document.querySelectorAll('.btn-fazer-simulado[data-id]').forEach((button) => {
            button.style.display = 'none';
        });
    }

    hideAprofundamentoSimuladoActions();

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

                // Add Ranking button if admin
                const userIsAdmin = await isAdmin();
                if (userIsAdmin && label && valor) {
                    let rankingBtn = document.getElementById('ranking-btn-1');
                    if (!rankingBtn) {
                        const scoreContainer = label.parentNode;
                        scoreContainer.style.flexDirection = 'column';
                        
                        const divRow = document.createElement('div');
                        divRow.style.display = 'flex';
                        divRow.style.flexDirection = 'row';
                        divRow.style.justifyContent = 'space-between';
                        divRow.style.width = '100%';
                        
                        divRow.appendChild(label);
                        divRow.appendChild(valor);

                        rankingBtn = document.createElement('a');
                        rankingBtn.id = 'ranking-btn-1';
                        rankingBtn.href = '#';
                        rankingBtn.textContent = 'Ranking';
                        rankingBtn.style.alignSelf = 'flex-end';
                        rankingBtn.style.color = '#aa77ff'; // Purple/admin color
                        rankingBtn.style.textDecoration = 'underline';
                        rankingBtn.style.fontSize = '0.9rem';
                        rankingBtn.style.marginBottom = '6px';
                        rankingBtn.style.marginTop = '4px';

                        rankingBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            showRankingModal('simulado1');
                        });
                        
                        scoreContainer.appendChild(rankingBtn);
                        scoreContainer.appendChild(divRow);
                    }
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

    async function showRankingModal(simuladoId) {
        try {
            const res = await fetch(`/api/simulado/${simuladoId}/ranking`, { credentials: 'include' });
            if (!res.ok) {
                if (res.status === 403) alert('Acesso restrito a administradores.');
                else alert('Erro ao carregar o ranking.');
                return;
            }
            const ranking = await res.json();
            
            const overlay = document.createElement('div');
            overlay.className = 'modal-erros-overlay'; // Reusing CSS from errros

            const box = document.createElement('div');
            box.className = 'modal-erros-box';
            box.style.maxHeight = '80vh';
            box.style.overflowY = 'auto';

            const header = document.createElement('div');
            header.className = 'modal-erros-header';
            
            const title = document.createElement('h3');
            title.textContent = 'Ranking do Simulado';
            
            const btnClose = document.createElement('button');
            btnClose.className = 'btn-fechar-erros';
            btnClose.innerHTML = '&times;';
            btnClose.onclick = () => document.body.removeChild(overlay);

            header.appendChild(title);
            header.appendChild(btnClose);
            box.appendChild(header);

            if (ranking.length === 0) {
                const p = document.createElement('p');
                p.textContent = 'Nenhum resultado disponível.';
                p.style.textAlign = 'center';
                p.style.marginTop = '20px';
                box.appendChild(p);
                overlay.appendChild(box);
                document.body.appendChild(overlay);
                return;
            }

            // Abas
            const tabsContainer = document.createElement('div');
            tabsContainer.style.display = 'flex';
            tabsContainer.style.gap = '10px';
            tabsContainer.style.marginBottom = '15px';
            tabsContainer.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
            tabsContainer.style.paddingBottom = '10px';
            
            const btnGeral = document.createElement('button');
            btnGeral.textContent = 'Geral';
            btnGeral.style.padding = '6px 12px';
            btnGeral.style.borderRadius = '8px';
            btnGeral.style.border = 'none';
            btnGeral.style.cursor = 'pointer';
            
            const btnTurma = document.createElement('button');
            btnTurma.textContent = 'Por Turma';
            btnTurma.style.padding = '6px 12px';
            btnTurma.style.borderRadius = '8px';
            btnTurma.style.border = 'none';
            btnTurma.style.cursor = 'pointer';
            
            const spacer = document.createElement('div');
            spacer.style.flex = '1';

            const btnExportPdf = document.createElement('button');
            btnExportPdf.innerHTML = '&#128196; Exportar PDF';
            btnExportPdf.style.padding = '6px 12px';
            btnExportPdf.style.borderRadius = '8px';
            btnExportPdf.style.border = 'none';
            btnExportPdf.style.cursor = 'pointer';
            btnExportPdf.style.backgroundColor = '#aa77ff';
            btnExportPdf.style.color = '#fff';
            btnExportPdf.onclick = () => {
                if (!window.jspdf || !window.jspdf.jsPDF) {
                    alert('Biblioteca PDF não carregada. Atualize a página e tente novamente.');
                    return;
                }
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                doc.setFontSize(18);
                doc.text('Ranking por Turma - Simulado', 14, 20);
                
                const classes = [...new Set(ranking.map(r => r.classDay || 'Sem Turma'))].sort();
                let startY = 30;
                
                classes.forEach((turma, index) => {
                    const turmaRanking = ranking.filter(r => (r.classDay || 'Sem Turma') === turma);
                    
                    let sorted = turmaRanking.sort((a,b) => b.score - a.score);
                    let currentRank = 1;
                    let displayRanking = [];
                    for(let i=0; i<sorted.length; i++) {
                        if(i>0 && sorted[i].score < sorted[i-1].score) currentRank++;
                        displayRanking.push([
                            currentRank,
                            sorted[i].studentName,
                            sorted[i].score + ' pts'
                        ]);
                    }
                    
                    if (index > 0) {
                        startY = doc.lastAutoTable.finalY + 15;
                    }
                    if (startY > 250) {
                        doc.addPage();
                        startY = 20;
                    }
                    
                    doc.setFontSize(14);
                    doc.text(`Turma: ${turma}`, 14, startY);
                    
                    doc.autoTable({
                        startY: startY + 5,
                        head: [['Posição', 'Aluno', 'Pontuação']],
                        body: displayRanking,
                        theme: 'striped',
                        headStyles: { fillColor: [170, 119, 255] }
                    });
                });
                
                doc.save('ranking_turmas.pdf');
            };
            
            tabsContainer.appendChild(btnGeral);
            tabsContainer.appendChild(btnTurma);
            tabsContainer.appendChild(spacer);
            tabsContainer.appendChild(btnExportPdf);
            box.appendChild(tabsContainer);

            const contentContainer = document.createElement('div');
            box.appendChild(contentContainer);

            function renderList(data, container) {
                const list = document.createElement('div');
                list.style.marginTop = '15px';
                
                let currentRank = 1;
                for (let i = 0; i < data.length; i++) {
                    if (i > 0 && data[i].score < data[i - 1].score) {
                        currentRank++;
                    }
                    
                    const item = document.createElement('div');
                    item.className = 'erro-item';
                    item.style.display = 'flex';
                    item.style.justifyContent = 'space-between';
                    item.style.alignItems = 'center';
                    
                    const position = document.createElement('strong');
                    position.textContent = `${currentRank}º Lugar`;
                    position.style.color = '#aa77ff'; 
                    position.style.width = '80px';
                    
                    const nameInfo = document.createElement('div');
                    nameInfo.style.flex = '1';
                    nameInfo.style.marginLeft = '10px';
                    
                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = data[i].studentName;
                    nameSpan.style.display = 'block';
                    
                    // Mostramos a turma em baixo apenas no raning geral p/ dar contexto
                    const turmaSpan = document.createElement('span');
                    turmaSpan.textContent = data[i].classDay;
                    turmaSpan.style.display = 'block';
                    turmaSpan.style.fontSize = '0.8em';
                    turmaSpan.style.color = '#94a3b8';
                    
                    nameInfo.appendChild(nameSpan);
                    nameInfo.appendChild(turmaSpan);
                    
                    const score = document.createElement('strong');
                    score.textContent = data[i].score;
                    score.style.color = '#10b981';
                    
                    item.appendChild(position);
                    item.appendChild(nameInfo);
                    item.appendChild(score);
                    list.appendChild(item);
                }
                container.appendChild(list);
            }

            function showGeral() {
                btnGeral.style.background = '#aa77ff';
                btnGeral.style.color = 'white';
                btnTurma.style.background = 'transparent';
                btnTurma.style.color = '#cbd5e1';
                
                contentContainer.innerHTML = '';
                renderList(ranking, contentContainer);
            }

            function showTurma() {
                btnTurma.style.background = '#aa77ff';
                btnTurma.style.color = 'white';
                btnGeral.style.background = 'transparent';
                btnGeral.style.color = '#cbd5e1';
                
                contentContainer.innerHTML = '';
                
                // Group by classDay
                const groups = {};
                ranking.forEach(r => {
                    const t = r.classDay || 'Sem Turma';
                    if (!groups[t]) groups[t] = [];
                    groups[t].push(r);
                });
                
                // Ordem desejada das turmas
                const customOrder = ['desconhecido', 'Sem Turma', 'Segunda', 'Terça', 'Quarta'];
                
                const sortedTurmas = Object.keys(groups).sort((a, b) => {
                    const indexA = customOrder.indexOf(a);
                    const indexB = customOrder.indexOf(b);
                    
                    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                    if (indexA !== -1) return -1;
                    if (indexB !== -1) return 1;
                    return a.localeCompare(b);
                });
                
                // Render each group
                sortedTurmas.forEach(turma => {
                    const groupTitle = document.createElement('h4');
                    groupTitle.textContent = "Turma: " + turma;
                    groupTitle.style.marginTop = '20px';
                    groupTitle.style.marginBottom = '10px';
                    groupTitle.style.color = '#e2e8f0';
                    groupTitle.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
                    groupTitle.style.paddingBottom = '5px';
                    contentContainer.appendChild(groupTitle);
                    
                    renderList(groups[turma], contentContainer);
                });
            }

            btnGeral.addEventListener('click', showGeral);
            btnTurma.addEventListener('click', showTurma);
            
            // Inicia na aba geral
            showGeral();

            overlay.appendChild(box);
            document.body.appendChild(overlay);

        } catch (error) {
            console.error('Erro ao chamar API do ranking:', error);
            alert('Não foi possível carregar o ranking no momento.');
        }
    }

});
