document.addEventListener('DOMContentLoaded', ()=>{
  // Dados de exemplo para desenhar os gráficos iniciais (substituiremos por dados reais depois)
  const lineData = [6.8,7.0,8.5,7.2,7.0,7.8,8.1,8.3];
  const lineLabels = ['Sim 1','Sim 2','Sim 3','Sim 4','Sim 5','Sim 6','Sim 7','Sim 8'];
  const barData = [2,18,36,22];
  const barLabels = ['0-4','5-6','7-8','9-10'];

  // Desenha gráficos simples em canvas (implementação própria, sem libs externas)
  const lineCanvas = document.getElementById('lineChart');
  const barCanvas = document.getElementById('barChart');
  if (lineCanvas && lineCanvas.getContext) drawLineChart(lineCanvas, lineData, lineLabels);
  if (barCanvas && barCanvas.getContext) drawBarChart(barCanvas, barData, barLabels);

  // Buscar alunos PAID e popular a tabela (inicial)
  initCustomSelect();
  const courseSelect = document.getElementById('courseFilter');
  const searchInput = document.getElementById('studentSearch');
  const currentSearch = searchInput ? searchInput.value : '';
  const currentCourse = getCourseValue();
  fetchPaidStudents(currentSearch || '', currentCourse || '');
  fetchEnrollmentSummary();
  fetchCommentsForDashboard();

  // Busca dinâmica enquanto digita (debounce)
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      const q = e.target.value || '';
      const mod = getCourseValue();
      fetchPaidStudents(q, mod);
    }, 300));
  }

  // Filtrar por curso
  if (courseSelect) {
    // custom-select handles change internally; keep for native select fallback
    courseSelect.addEventListener('change', (e) => {
      const mod = e.target.value || '';
      const q = searchInput ? searchInput.value : '';
      fetchPaidStudents(q || '', mod);
    });
  }

  // Listeners para ordenação
  const thProgress = document.getElementById('th-progress');
  if (thProgress) {
    thProgress.addEventListener('click', () => handleHeaderClick('progress'));
  }
  const thName = document.getElementById('th-name');
  if (thName) {
    thName.addEventListener('click', () => handleHeaderClick('name'));
  }
  
  // Inicializa ícones de ordenação
  updateSortIcons();
});

function drawLineChart(canvas, data, labels){
  const ctx = canvas.getContext('2d');
  const DPR = window.devicePixelRatio || 1;
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  ctx.scale(DPR, DPR);
  ctx.clearRect(0,0,W,H);

  const padding = 10;
  const max = Math.max(...data) * 1.1;
  const min = Math.min(...data) * 0.95;
  const range = max - min || 1;

  // grid
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i=0;i<4;i++){
    const y = padding + (H - padding*2) * (i/3);
    ctx.beginPath(); ctx.moveTo(padding,y); ctx.lineTo(W-padding,y); ctx.stroke();
  }

  // line
  ctx.beginPath();
  data.forEach((v,i)=>{
    const x = padding + (W - padding*2) * (i/(data.length-1));
    const y = padding + (H - padding*2) * (1 - (v - min)/range);
    if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.strokeStyle = '#6ee7b7';
  ctx.lineWidth = 2;
  ctx.stroke();

  // points
  data.forEach((v,i)=>{
    const x = padding + (W - padding*2) * (i/(data.length-1));
    const y = padding + (H - padding*2) * (1 - (v - min)/range);
    ctx.fillStyle = '#6ee7b7';
    ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill();
  });
}

function drawBarChart(canvas, data, labels){
  const ctx = canvas.getContext('2d');
  const DPR = window.devicePixelRatio || 1;
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  ctx.scale(DPR, DPR);
  ctx.clearRect(0,0,W,H);

  const padding = 14;
  const max = Math.max(...data) * 1.2 || 1;
  const barW = (W - padding*2) / data.length * 0.7;

  data.forEach((v,i)=>{
    const x = padding + i * ((W - padding*2) / data.length) + ((W - padding*2) / data.length - barW)/2;
    const h = (H - padding*2) * (v/max);
    const y = H - padding - h;
    ctx.fillStyle = '#3ab0ff';
    ctx.fillRect(x,y,barW,h);
  });
}

// Variáveis globais para ordenação e cache
let cachedStudents = [];
let sortCol = 'progress'; // 'name' | 'progress'
let sortAsc = false; // false = desc (maior primeiro), true = asc (A-Z ou menor primeiro)

function handleHeaderClick(colName) {
  if (sortCol === colName) {
    // Se clicar na mesma, inverte
    sortAsc = !sortAsc;
  } else {
    // Nova coluna
    sortCol = colName;
    // Padrões iniciais: Nome -> A-Z (asc), Progresso -> Maior% (desc)
    if (colName === 'name') sortAsc = true;
    else sortAsc = false;
  }
  updateSortIcons();
  sortStudentsAndRender();
}

function updateSortIcons() {
  const map = { 'name': 'th-name', 'progress': 'th-progress' };
  
  // Limpa todos e seta o ativo
  Object.keys(map).forEach(key => {
    const th = document.getElementById(map[key]);
    if (!th) return;
    const span = th.querySelector('span');
    if (!span) return;

    if (key === sortCol) {
      span.textContent = sortAsc ? '▲' : '▼';
      th.classList.add('sort-active'); // opcional, para CSS futuro
    } else {
      span.textContent = '⇅'; // ou vazio se preferir
      th.classList.remove('sort-active');
    }
  });
}

function sortStudentsAndRender(){
  if (!cachedStudents || cachedStudents.length === 0) return;

  cachedStudents.sort((a,b) => {
    if (sortCol === 'name') {
      const na = (a.name || '').trim();
      const nb = (b.name || '').trim();
      return sortAsc 
        ? na.localeCompare(nb, 'pt-BR', { sensitivity: 'base' })
        : nb.localeCompare(na, 'pt-BR', { sensitivity: 'base' });
    } else {
      // progress
      const pa = Number(a.lessonsPercent || (a.lessons && a.lessons.percent) || 0);
      const pb = Number(b.lessonsPercent || (b.lessons && b.lessons.percent) || 0);
      return sortAsc ? (pa - pb) : (pb - pa);
    }
  });

  renderStudentsTable(cachedStudents);
}

function renderStudentsTable(students){
  const tbody = document.getElementById('studentsBody');
  tbody.innerHTML = '';

  if (!Array.isArray(students)) {
     tbody.innerHTML = `<tr><td colspan="7" style="color:var(--muted)">Erro ao exibir dados.</td></tr>`;
     return;
  }

  if (students.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="color:var(--muted)">Nenhum aluno encontrado.</td></tr>';
    return;
  }

  students.forEach(s => {
    const tr = document.createElement('tr');
    
    let lastAccessStr = '—';
    if (s.lastAccess) {
      lastAccessStr = new Date(s.lastAccess).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
    }

    const percent = Number(s.lessonsPercent || (s.lessons && s.lessons.percent) || 0);

    tr.innerHTML = `
      <td>${escapeHtml(s.name)}</td>
      <td>${lastAccessStr}</td>
      <td>${escapeHtml(s.modality || '')}</td>
      <td><div class="progress"><div style="width:${percent}%"></div></div>${percent}%</td>
      <td>—</td>
      <td class="status active">Ativo</td>
      <td><button class="link-btn" onclick="openStudentDetails('${s.id}', '${escapeHtml(s.name.replace(/'/g, "\\'"))}')">Ver Detalhes</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// Estilo para o botão parecer link
const styleBtn = document.createElement('style');
styleBtn.textContent = `.link-btn { background:none; border:none; color:#8fb7ff; cursor:pointer; text-decoration:none; font-size:inherit; padding:0; } .link-btn:hover { text-decoration:underline; }`;
document.head.appendChild(styleBtn);

async function openStudentDetails(studentId, studentName) {
  const modal = document.getElementById('studentDetailsModal');
  const tbody = document.getElementById('detailsTableBody');
  const nameDisplay = document.getElementById('studentNameDisplay');
  
  if(nameDisplay) nameDisplay.textContent = studentName;
  if(tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--muted)">Carregando histórico...</td></tr>';
  
  if(modal) modal.classList.add('open');

  try {
    const res = await fetch(`/api/progress/student/${studentId}`);
    if (!res.ok) throw new Error('Erro ao buscar detalhes');
    const history = await res.json();

    if(tbody) {
      tbody.innerHTML = '';
      if (!history || history.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--muted); padding:20px;">Nenhum histórico de visualização encontrado.</td></tr>';
        return;
      }

      history.forEach(item => {
        const lessonName = getLessonName(item.lessonId) || `ID: ${item.lessonId}`;
        const statusMap = { 'COMPLETED': 'Concluído', 'IN_PROGRESS': 'Em andamento' };
        const statusLabel = statusMap[item.status] || item.status;
        const color = item.status === 'COMPLETED' ? 'var(--accent)' : 'var(--muted)';
        
        let timeWatched = formatSeconds(item.watchedSeconds);
        const date = new Date(item.watchedAt).toLocaleString('pt-BR');

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${escapeHtml(lessonName)}</td>
          <td style="color:${color}; font-weight:600;">${statusLabel}</td>
          <td>${timeWatched}</td>
          <td style="font-size:0.9em; color:var(--muted);">${date}</td>
        `;
        tbody.appendChild(tr);
      });
    }

  } catch (err) {
    console.error(err);
    if(tbody) tbody.innerHTML = '<tr><td colspan="4" style="color:var(--danger); text-align:center;">Erro ao carregar dados.</td></tr>';
  }
}

function closeStudentDetails() {
  const modal = document.getElementById('studentDetailsModal');
  if(modal) modal.classList.remove('open');
}

function formatSeconds(sec) {
  if (!sec) return '0s';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function getLessonName(lessonId) {
  if (!window.cursoData) return null;
  
  // Tenta achar direto pelo ID se houver mapa plano ou varrer a estrutura
  // A estrutura é cursoData[modId].aulas -> array
  // Cada aula pode ter subAulas
  // Precisamos varrer tudo. Otimização: Cachear mapa na primeira vez.
  
  if (!window._lessonMapCache) {
    window._lessonMapCache = {};
    Object.values(window.cursoData).forEach(mod => {
      if (mod.aulas) {
        mod.aulas.forEach((aula, idx) => {
          // Aula Principal: ID é gerado como modId.aulaIdx+1
           // Mas espere, o sistema usa vimeoId ou ID composto?
           // O progressController usa lessonId enviado pelo frontend.
           // No frontend (assistir.js) o ID é composto: `${modId}.${aulaIdx}` ou subAulaIdx.
           // Vou assumir que o LessonId gravado no banco segue o padra "1.1", "1.1.2", etc.
           
           // A estrutura precisa bater com como é salvo.
           // Vamos varrer gerando os IDs teóricos e ver se bate ou descobrindo o nome.
           // Infelizmente o lessonId gravado é meio "opaco" sem ver o assistir.js a fundo.
           // Mas vou tentar criar um mapeamento recursivo de nomes.
        });
      }
    });
  }
  
  // Solução robusta de varredura (lenta, mas ok para poucos itens)
  for (const modId in window.cursoData) {
    const mod = window.cursoData[modId];
    if (mod.aulas) {
      for (let i = 0; i < mod.aulas.length; i++) {
        const aula = mod.aulas[i];
        const aulaIdMain = `${modId}.${i + 1}`;
        if (String(lessonId) === aulaIdMain) return `${mod.tituloModulo} - ${aula.titulo}`;
        
        if (aula.subAulas) {
          for (let j = 0; j < aula.subAulas.length; j++) {
            const sub = aula.subAulas[j];
            const subId = `${modId}.${i + 1}.${j + 1}`;
            if (String(lessonId) === subId) return `${mod.tituloModulo} - ${aula.titulo}: ${sub.titulo}`;
          }
        }
      }
    }
  }
  return null;
}

async function fetchPaidStudents(q = '', modality = ''){
  const debugElId = 'studentsDebug';
  try{
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (modality) params.set('modality', modality);
    const url = '/api/enrollment/paid' + (params.toString() ? '?' + params.toString() : '');
    const res = await fetch(url);
    const tbody = document.getElementById('studentsBody');
    const debugContainer = getOrCreateDebugContainer();
    debugContainer.textContent = `HTTP ${res.status} ${res.statusText}  q=${q} modality=${modality}`;

    let students = [];
    try { students = await res.json(); } catch(e) { console.error('Erro ao parsear JSON', e); debugContainer.textContent += '\nJSON parse error'; }

    // Salva no cache global
    cachedStudents = Array.isArray(students) ? students : [];

    // Se houve erro no backend (objeto de erro retornado em vez de array)
    if (!Array.isArray(students)) {
        const msg = students && (students.error || students.message) ? (students.error || students.message) : 'Resposta inesperada do servidor';
        const tbody = document.getElementById('studentsBody'); // Precisa pegar aqui pois removemos a lógica inline
        tbody.innerHTML = `<tr><td colspan="7" style="color:var(--muted)">Erro ao carregar alunos: ${escapeHtml(String(msg))}</td></tr>`;
        return;
    }

    // Renderiza usando a função separada (que já sabe lidar com o array)
    // Mantém a ordenação atual se já houver clicado, ou ordena default? 
    // Vamos chamar sortStudentsAndRender() para garantir ordenação consistente
    sortStudentsAndRender();

    debugContainer.textContent += `\nEncontrados ${students.length} alunos`;
  }catch(err){
    console.error(err);
    const tbody = document.getElementById('studentsBody');
    tbody.innerHTML = '<tr><td colspan="7" style="color:var(--muted)">Erro ao carregar alunos.</td></tr>';
    // const debugContainer = getOrCreateDebugContainer(); // Já criado acima no try, mas se falhar antes...
  }
}

async function fetchEnrollmentSummary(){
  try{
    const res = await fetch('/api/enrollment/summary');
    if (!res.ok) return;
    const json = await res.json();
    const paidEl = document.getElementById('activeStudentsCount');
    const pctEl = document.getElementById('activeStudentsPercent');
    const avgEl = document.getElementById('averageLessonsPercent');
    if (paidEl) paidEl.textContent = (json.paidCount || 0).toLocaleString('pt-BR');
    if (pctEl) pctEl.textContent = `${(json.percent || 0)}%`;
    if (avgEl) avgEl.textContent = `${(json.averageLessonsPercent != null ? json.averageLessonsPercent : 0)}%`;
  }catch(e){
    console.error('Erro ao buscar resumo de inscrições', e);
  }
}

function getCourseValue(){
  const cs = document.getElementById('courseFilter');
  if (!cs) return '';
  if (cs.classList.contains('custom-select')) return cs.getAttribute('data-value') || '';
  return cs.value || '';
}

function initCustomSelect(){
  const cs = document.getElementById('courseFilter');
  if (!cs) return;
  // If native select left in place, skip (we replaced it in HTML)
  if (!cs.classList.contains('custom-select')) return;

  const label = cs.querySelector('.cs-label');
  const options = cs.querySelectorAll('.cs-options li');

  cs.addEventListener('click', (e)=>{
    cs.classList.toggle('open');
  });

  options.forEach(li=>{
    li.addEventListener('click', (e)=>{
      e.stopPropagation();
      const val = li.getAttribute('data-value') || '';
      cs.setAttribute('data-value', val);
      label.textContent = li.textContent;
      cs.classList.remove('open');
      const q = document.getElementById('studentSearch')?.value || '';
      fetchPaidStudents(q, val);
    });
  });

  // Close when clicking outside
  document.addEventListener('click', (e)=>{
    if (!cs.contains(e.target)) cs.classList.remove('open');
  });

  // keyboard
  cs.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cs.classList.toggle('open'); }
    if (e.key === 'Escape') cs.classList.remove('open');
  });
}

function debounce(fn, wait){
  let t;
  return function(...args){
    clearTimeout(t);
    t = setTimeout(()=>fn.apply(this,args), wait);
  }
}

function escapeHtml(str){
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function getOrCreateDebugContainer(){
  let el = document.getElementById('studentsDebug');
  if (!el) {
    el = document.createElement('pre');
    el.id = 'studentsDebug';
    el.style.color = 'var(--muted)';
    el.style.fontSize = '12px';
    el.style.marginTop = '8px';
    const table = document.querySelector('.panel .students-table');
    if (table && table.parentElement) table.parentElement.appendChild(el);
    else document.body.appendChild(el);
  }
  return el;
}

// --- Lógica de Comentários ---
async function fetchCommentsForDashboard() {
  const listEl = document.getElementById('comments-list');
  try {
    const res = await fetch('/api/comments?limit=5');
    if (!res.ok) throw new Error('Erro ao buscar comentários');
    const comments = await res.json();
    
    listEl.innerHTML = '';
    if (comments.length === 0) {
      listEl.innerHTML = '<div style="color:var(--muted); padding:5px;">Nenhum comentário recente.</div>';
      return;
    }

    comments.forEach(c => {
      const div = document.createElement('div');
      div.style.padding = '8px 0';
      div.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
      
      const date = new Date(c.createdAt).toLocaleDateString('pt-BR');
      const name = c.enrollment ? c.enrollment.name.split(' ')[0] : 'Anônimo';
      
      div.innerHTML = `
        <div style="font-size:0.85em; color:var(--text-secondary); display:flex; justify-content:space-between;">
           <span>${escapeHtml(name)}</span> <span>${date}</span>
        </div>
        <div style="font-size:0.95em; margin-top:2px;">${escapeHtml(c.content.substring(0, 60))}${c.content.length>60?'...':''}</div>
        <div style="font-size:0.75em; color:var(--muted); margin-top:2px;">Aula ID: ${c.lessonId}</div>
      `;
      listEl.appendChild(div);
    });

    // Setup Modal
    const btn = document.getElementById('view-all-comments');
    const modal = document.getElementById('commentsModal');
    const close = document.getElementById('closeCommentsModal');
    
    if(btn && modal && close) {
        btn.onclick = () => {
             modal.style.display = 'flex';
             fetchAllCommentsForModal();
        };
        close.onclick = () => { modal.style.display = 'none'; };
        
        // Close on click outside
        modal.onclick = (e) => {
           if(e.target === modal) modal.style.display = 'none';
        };
    }

  } catch (e) {
    console.error(e);
    if(listEl) listEl.innerHTML = '<div style="color:red">Erro ao carregar comments</div>';
  }
}

async function fetchAllCommentsForModal() {
    const container = document.getElementById('modalCommentsList');
    container.innerHTML = 'Carregando todos os comentários...';
    
    try {
        const res = await fetch('/api/comments?limit=100');
        const comments = await res.json();
        
        container.innerHTML = '';
        if (comments.length === 0) {
            container.innerHTML = 'Nenhum comentário encontrado.';
            return;
        }
        
        comments.forEach(c => {
            const div = document.createElement('div');
            div.style.background = 'rgba(255,255,255,0.03)';
            div.style.padding = '10px';
            div.style.marginBottom = '10px';
            div.style.borderRadius = '5px';
            
            const date = new Date(c.createdAt).toLocaleString('pt-BR');
            const name = c.enrollment ? c.enrollment.name : 'Desconhecido';
            const email = c.enrollment ? c.enrollment.email : '';
            
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:5px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:5px;">
                    <strong style="color:#6ee7b7">${escapeHtml(name)} <span style="font-weight:normal; color:var(--muted); font-size:0.9em;">(${email})</span></strong>
                    <span style="font-size:0.85em; color:var(--text-secondary)">${date}</span>
                </div>
                <div style="margin-bottom:5px; white-space:pre-wrap;">${escapeHtml(c.content)}</div>
                <div style="font-size:0.8em; color:var(--muted); text-align:right;">Aula: ${c.lessonId}</div>
            `;
            container.appendChild(div);
        });
        
    } catch(e) {
        container.innerHTML = 'Erro ao carregar comentários.';
    }
}

// Helper para escape (reuso se já existir, senão define)
if (typeof window.escapeHtml !== 'function') {
    window.escapeHtml = function(text) {
      if (!text) return '';
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
}
