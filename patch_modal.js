const fs = require('fs');

const file = 'public/scripts/simulados.js';
let content = fs.readFileSync(file, 'utf8');

const oldModalRegex = /async function showRankingModal.*?\}\n\n\}\);/s;

const newModal = `async function showRankingModal(simuladoId) {
        try {
            const res = await fetch(\`/api/simulado/\${simuladoId}/ranking\`, { credentials: 'include' });
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
            
            tabsContainer.appendChild(btnGeral);
            tabsContainer.appendChild(btnTurma);
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
                    position.textContent = \`\${currentRank}º Lugar\`;
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
                
                // Render each group
                Object.keys(groups).sort().forEach(turma => {
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

});`;

content = content.replace(oldModalRegex, newModal);
fs.writeFileSync(file, content);
