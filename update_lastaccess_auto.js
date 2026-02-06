const fs = require('fs');
const path = require('path');

// 1. Atualizar enrollmentController.js
const controllerPath = path.join(__dirname, 'api/src/controllers/enrollmentController.js');
let controllerContent = fs.readFileSync(controllerPath, 'utf8');

// A. Inserir atualização do lastAccess no login
const loginRegex = /if \(!\['PAID','ADMIN'\]\.includes\(user\.status\)\) \{\s*return res\.status\(403\)\.json\(\{ error: "Seu pagamento ainda não foi confirmado\." \}\);\s*\}/;
const loginReplacement = `if (!['PAID','ADMIN'].includes(user.status)) {
               return res.status(403).json({ error: "Seu pagamento ainda não foi confirmado." });
           }

        // AUTO-ADDED: Last Access Update
        try { await prisma.enrollment.update({ where: { id: user.id }, data: { lastAccess: new Date() } }); } catch(e){ console.error("Erro lastAccess",e); }`;

if (!controllerContent.includes('lastAccess Update')) {
    if (loginRegex.test(controllerContent)) {
        controllerContent = controllerContent.replace(loginRegex, loginReplacement);
        console.log('✅ enrollmentController.js (login logic) updated.');
    } else {
        console.log('❌ Could not find login logic pattern in enrollmentController.js');
    }
} else {
    console.log('ℹ️ enrollmentController.js (login logic) already updated.');
}

// B. Inserir campo no select
const selectRegex = /select: \{\s*id: true,\s*name: true,\s*email: true,\s*cpf: true,\s*phone: true,\s*modality: true,\s*amount: true,\s*createdAt: true\s*\}/;
const selectReplacement = `select: {
                id: true,
                name: true,
                email: true,
                cpf: true,
                phone: true,
                modality: true,
                amount: true,
                lastAccess: true, // Adicionado
                createdAt: true
            }`;

// Simplificar regex para pegar o bloco, pois espaços podem variar
// Vamos procurar por "amount: true," seguido de "createdAt: true"
const simpleSelectRegex = /amount: true,\s*createdAt: true/g;

if (!controllerContent.includes('lastAccess: true')) {
    if (simpleSelectRegex.test(controllerContent)) {
        controllerContent = controllerContent.replace(simpleSelectRegex, 'amount: true,\n                lastAccess: true,\n                createdAt: true');
        console.log('✅ enrollmentController.js (select logic) updated.');
    } else {
        console.log('❌ Could not find select logic pattern in enrollmentController.js');
    }
}

fs.writeFileSync(controllerPath, controllerContent);


// 2. Atualizar monitoramento.js
const monitoramentoPath = path.join(__dirname, 'public/scripts/monitoramento.js');
let monitoramentoContent = fs.readFileSync(monitoramentoPath, 'utf8');

const tdRegex = /<td>—<\/td>/;
const tdReplacement = '<td>${s.lastAccess ? new Date(s.lastAccess).toLocaleString() : "—"}</td>';

if (monitoramentoContent.includes('<td>—</td>')) {
    // Precisamos escapar o ${} para que não seja interpretado agora, mas sim escrito no arquivo
    // No replace string, '$' tem significado especial, então usamos '$$'
    // Mas espere, estamos escrevendo uma Template String JS dentro do arquivo.
    // O código alvo usa backticks `. 
    // Vamos substituir a linha inteira do TR para garantir.
    
    // A linha original é: <td>—</td>
    // A nova linha deve ser dinâmica.
    
    monitoramentoContent = monitoramentoContent.replace(
        '<td>—</td>', 
        '<td>${s.lastAccess ? new Date(s.lastAccess).toLocaleDateString("pt-BR") + " " + new Date(s.lastAccess).toLocaleTimeString("pt-BR", {hour:"2-digit",minute:"2-digit"}) : "—"}</td>'
    );
    console.log('✅ monitoramento.js updated.');
    fs.writeFileSync(monitoramentoPath, monitoramentoContent);
} else {
     console.log('ℹ️ monitoramento.js already updated or pattern not found.');
}

console.log('Done.');
