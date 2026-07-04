document.addEventListener('DOMContentLoaded', async () => {
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

    const modality = await getUserModality();
    if (modality.toLowerCase().includes('aprofundamento')) {
        alert('Os simulados não estão disponíveis para alunos de Aprofundamento.');
        window.location.href = '/simulados.html';
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const idCombinado = params.get('id') || '1.1';

    // Parsear ID combinado (ex: "1.2" -> modulo=1, assunto=2)
    const [moduloNum, assuntoNum] = idCombinado.split('.').map(Number);
    
    const data = window.cursoData;
    const mod = data && data[moduloNum];
    const assunto = mod && mod.aulas && mod.aulas[assuntoNum - 1];

    console.log('ID:', idCombinado, 'Módulo:', moduloNum, 'Assunto:', assuntoNum, 'Dados:', assunto);
    
    const tituloPrincipal = document.querySelector('.assuntoSimulado');

    if (tituloPrincipal) {
        const textoAssunto = assunto ? assunto.titulo : 'Assunto não encontrado';
        tituloPrincipal.innerText = textoAssunto;
    }
});