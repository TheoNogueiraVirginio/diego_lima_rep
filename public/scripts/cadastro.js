// --- CONFIGURAÇÃO INICIAL ---
// PUBLIC KEY DE PRODUÇÃO (Começa com "APP_USR-")
const mp = new MercadoPago('APP_USR-f2069842-413b-44c0-89c4-9ede49a0e6c1');

// Lógica para definir a URL da API automaticamente
// No Vercel (Prod ou Dev), a API está no mesmo domínio/porta
const API_BASE_URL = ''; 
// Se precisar rodar o backend separado localmente (ex: node server.js na porta 4000), descomente abaixo:
// const API_BASE_URL = 'http://localhost:4000';

let paymentMethodId = '';
let selectedCardBin = '';
let installmentRequestId = 0;
let intervaloVerificacao = null;
let submissionInProgress = false;

// --- PREÇOS LOCAIS (mesmas regras do backend) ---
const FRONT_PRECOS = {
    TIER_4: { COM: 999.90, SEM: 559.90 }
};

function calcularPrecoFrontend(modality) {
    return (modality === 'COM_MATERIAL') ? FRONT_PRECOS.TIER_4.COM : FRONT_PRECOS.TIER_4.SEM;
}

function formatarReal(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function atualizarResumoPreco() {
    const summary = document.getElementById('checkout-price-summary');
    const modalidade = document.getElementById('modalidade')?.value;
    const pagamento = document.getElementById('pagamento')?.value;
    const parcelas = Number(document.getElementById('parcelas')?.value) || 1;
    if (!summary) return;

    if (!modalidade) {
        summary.innerText = 'Selecione uma modalidade para ver o valor.';
        return;
    }

    const total = calcularPrecoFrontend(modalidade);
    const parcelamento = pagamento === 'cartao'
        ? ` — ${parcelas}x (total ${formatarReal(total)})`
        : '';

    summary.innerText = `Total: ${formatarReal(total)}${parcelamento}`;
}

function normalizeCoupon(code) {
    if (!code) return '';
    const cup = String(code || '')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/\s+/g, '')
        .replace(/[^A-Za-z0-9]/g, '')
        .toUpperCase();
    return cup;
}

async function fetchCouponData(couponRaw) {
    const cup = normalizeCoupon(couponRaw);
    if (!cup) return null;
    try {
        const response = await fetch(`/api/coupons/validate/${cup}`);
        if (response.ok) {
            const data = await response.json();
            if (data.valid && data.coupon) {
                return data.coupon;
            }
        }
    } catch (e) {
        console.error("Erro ao validar cupom", e);
    }
    return null;
}

let couponTimeout;
async function updateCouponPreview() {
    try {
        const feedback = document.getElementById('coupon-feedback');
        if (!feedback) return;

        const cupInput = document.getElementById('input-cupom');
        const modalidadeEl = document.getElementById('modalidade');
        const pagamentoEl = document.getElementById('pagamento');

        const cup = cupInput ? cupInput.value.trim() : '';
        clearTimeout(couponTimeout);
        const modality = modalidadeEl ? modalidadeEl.value : '';
        const pagamento = pagamentoEl ? pagamentoEl.value : 'pix';

        atualizarResumoPreco();

        if (!modality) {
            feedback.innerText = '';
            return;
        }

        const base = calcularPrecoFrontend(modality);
        let final = base;

        // Se não houver cupom digitado, limpa mensagem
        if (!cup) {
            feedback.innerText = '';
            if (selectedCardBin) refreshCardInstallments();
            return;
        }

        couponTimeout = setTimeout(async () => {
            const couponData = await fetchCouponData(cup);
            if (couponData) {
                if (couponData.type === 'FIXED_PRICE') {
                    final = couponData.discount;
                } else {
                    final = Number((base * (1 - couponData.discount / 100)).toFixed(2));
                }
                if (final <= 0 || final > base) {
                    feedback.innerHTML = '<span style="color:red;">Cupom não aplicável a esta modalidade</span>';
                    if (selectedCardBin) refreshCardInstallments();
                    return;
                }

                feedback.innerHTML = `Valor com cupom: <strong style="color:var(--highlight);">${formatarReal(final)}</strong>` +
                    (pagamento === 'cartao' ? ' — parcelas sem acréscimo disponíveis para este cartão' : '');
                atualizarResumoPreco();
            } else {
                feedback.innerHTML = `<span style="color:red;">Cupom inválido</span>`;
            }
            if (selectedCardBin) refreshCardInstallments();
        }, 500);

    } catch (e) {
        console.warn('Erro ao atualizar preview do cupom:', e.message || e);
    }
}

// 1. MÁSCARAS DE INPUT (FORMATACAO AUTOMÁTICA)

// (Adiciona a / automaticamente na data)
document.getElementById('cardExpiration').addEventListener('input', function (e) {
    let input = e.target.value.replace(/\D/g, ''); // Remove letras
    if (input.length > 2) {
        input = input.substring(0, 2) + '/' + input.substring(2, 4);
    }
    e.target.value = input;
});

// (Adiciona espaço a cada 4 dígitos do N do cartão)
document.getElementById('cardNumber').addEventListener('input', function (e) {
    let input = e.target.value.replace(/\D/g, ''); // Remove letras
    input = input.substring(0, 16); // Limita a 16 números
    if (input.length > 0) {
        input = input.match(/.{1,4}/g).join(' '); // Espaço a cada 4
    }
    e.target.value = input;
});

// --- MÁSCARA CPF (em tempo real) ---
const cpfField = document.getElementById('cpf');
if (cpfField) {
    cpfField.addEventListener('input', function (e) {
        const raw = e.target.value.replace(/\D/g, '');
        e.target.value = (typeof window.formatCPF === 'function') ? window.formatCPF(raw) : raw;
    });
}

// --- MÁSCARA TELEFONE (em tempo real) ---
const phoneField = document.getElementById('telefone');
if (phoneField) {
    phoneField.addEventListener('input', function (e) {
        let v = e.target.value.replace(/\D/g, '').slice(0, 11); // até 11 dígitos (DD + 9)
        if (v.length <= 2) {
            e.target.value = v;
            return;
        }

        const ddd = v.slice(0, 2);
        const rest = v.slice(2);

        if (rest.length <= 4) {
            e.target.value = `(${ddd}) ${rest}`;
        } else if (rest.length <= 7) {
            e.target.value = `(${ddd}) ${rest.slice(0, rest.length - 4)}-${rest.slice(-4)}`;
        } else { // 9 dígitos no corpo
            e.target.value = `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
        }
    });
}

function resetInstallmentOptions(message) {
    const select = document.getElementById('parcelas');
    const feedback = document.getElementById('installment-feedback');
    select.innerHTML = '';
    select.disabled = true;
    const option = document.createElement('option');
    option.value = '';
    option.textContent = message;
    select.appendChild(option);
    feedback.textContent = message;
}

async function refreshCardInstallments() {
    const requestId = ++installmentRequestId;
    const select = document.getElementById('parcelas');
    const previousSelection = select.value;
    const cardNumber = document.getElementById('cardNumber').value.replace(/\D/g, '');
    const bin = cardNumber.slice(0, 6);
    selectedCardBin = /^\d{6}$/.test(bin) ? bin : '';
    paymentMethodId = '';
    resetInstallmentOptions('Consultando opções sem acréscimo...');

    if (!selectedCardBin || document.getElementById('pagamento').value !== 'cartao') {
        resetInstallmentOptions('Informe o cartão para consultar');
        return;
    }

    try {
        const paymentMethods = await mp.getPaymentMethods({ bin: selectedCardBin });
        if (requestId !== installmentRequestId) return;

        const cardMethod = paymentMethods.results?.find((method) => method.payment_type_id === 'credit_card');
        if (!cardMethod) {
            resetInstallmentOptions('Não foi possível identificar um cartão de crédito válido.');
            return;
        }

        paymentMethodId = cardMethod.id;
        const params = new URLSearchParams({
            bin: selectedCardBin,
            modality: document.getElementById('modalidade').value,
            coupon: document.getElementById('input-cupom')?.value || '',
            paymentMethodId
        });
        const response = await fetch(`${API_BASE_URL}/api/enrollment/installments?${params}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Não foi possível consultar parcelas.');
        if (requestId !== installmentRequestId) return;

        const feedback = document.getElementById('installment-feedback');
        select.innerHTML = '';
        if (!result.options.length) {
            resetInstallmentOptions('Este cartão não tem parcelas sem acréscimo disponíveis. Use Pix ou outro cartão.');
            return;
        }

        result.options.forEach((installment) => {
            const option = document.createElement('option');
            option.value = `${installment.issuerId}:${installment.installments}`;
            option.dataset.issuerId = installment.issuerId;
            option.dataset.installments = String(installment.installments);
            option.textContent = `${installment.installments}x de ${formatarReal(installment.installmentAmount)} — total ${formatarReal(installment.totalAmount)}`;
            select.appendChild(option);
        });
        if ([...select.options].some((option) => option.value === previousSelection)) {
            select.value = previousSelection;
        }
        select.disabled = false;
        feedback.textContent = `Opções consultadas para total de ${formatarReal(result.amount)}.`;
        atualizarResumoPreco();
    } catch (error) {
        if (requestId !== installmentRequestId) return;
        paymentMethodId = '';
        resetInstallmentOptions(error.message || 'Falha ao consultar parcelas sem acréscimo.');
        console.error('Erro ao consultar parcelas:', error);
    }
}

let installmentRefreshTimer;
document.getElementById('cardNumber').addEventListener('input', () => {
    clearTimeout(installmentRefreshTimer);
    installmentRefreshTimer = setTimeout(refreshCardInstallments, 250);
});

// --- Modal de confirmação customizada (retorna Promise<boolean>) ---
function showConfirmModal(message) {
    return new Promise((resolve) => {
        // Overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.left = '0';
        overlay.style.top = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(0,0,0,0.6)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '10000';

        const box = document.createElement('div');
        box.style.maxWidth = '520px';
        box.style.width = '90%';
        box.style.background = '#0b0b0b';
        box.style.padding = '20px';
        box.style.borderRadius = '12px';
        box.style.boxShadow = '0 10px 30px rgba(0,0,0,0.7)';
        box.style.color = '#fff';
        box.style.textAlign = 'center';

        const msg = document.createElement('p');
        msg.style.marginBottom = '18px';
        msg.style.lineHeight = '1.4';
        msg.innerText = message;

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.justifyContent = 'center';
        actions.style.gap = '12px';

        const btnCancel = document.createElement('button');
        btnCancel.innerText = 'Cancelar';
        btnCancel.style.padding = '10px 16px';
        btnCancel.style.borderRadius = '8px';
        btnCancel.style.border = '1px solid #444';
        btnCancel.style.background = '#111';
        btnCancel.style.color = '#fff';
        btnCancel.style.cursor = 'pointer';

        const btnConfirm = document.createElement('button');
        btnConfirm.innerText = 'Confirmar';
        btnConfirm.style.padding = '10px 16px';
        btnConfirm.style.borderRadius = '8px';
        btnConfirm.style.border = 'none';
        btnConfirm.style.background = '#9d4edd';
        btnConfirm.style.color = '#fff';
        btnConfirm.style.cursor = 'pointer';

        btnCancel.addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(false);
        });

        btnConfirm.addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(true);
        });

        actions.appendChild(btnCancel);
        actions.appendChild(btnConfirm);
        box.appendChild(msg);
        box.appendChild(actions);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    });
}

// 3. CONTROLE DE VISIBILIDADE (CARTÃO/PIX)
document.getElementById('pagamento').addEventListener('change', function () {
    const formaPagamento = this.value;
    const cardFields = document.getElementById('card-fields');

    if (formaPagamento === 'cartao') {
        cardFields.style.display = 'block';
        refreshCardInstallments();
    } else {
        installmentRequestId += 1;
        cardFields.style.display = 'none';
        paymentMethodId = '';
        selectedCardBin = '';
        resetInstallmentOptions('Informe o cartão para consultar');
    }
});

// 4. CONTROLE DOS TERMOS (Reseta se desmarcar)
document.getElementById('termos').addEventListener('change', function () {
    if (!this.checked) {
        if (intervaloVerificacao) clearInterval(intervaloVerificacao);
        const qrBox = document.querySelector('.qr-placeholder');
        qrBox.innerHTML = '<p>O QR Code aparecerá aqui após gerar o pagamento.</p>';
        qrBox.style.opacity = '0.7';
        qrBox.style.border = '2px dashed var(--color-lime-green)';
    }
});

// 5. SUBMISSÃO DO FORMULÁRIO
document.querySelector('.checkout-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submissionInProgress) return;

    submissionInProgress = true;
    const submitButton = document.querySelector('.btn-submit');
    submitButton.disabled = true;
    try {
        await processCheckout();
    } catch (error) {
        console.error('Erro ao finalizar inscrição:', error);
        alert(error.message || 'Não foi possível iniciar o pagamento.');
    } finally {
        submissionInProgress = false;
        submitButton.disabled = false;
        submitButton.innerText = 'GERAR PAGAMENTO';
    }
});

async function processCheckout() {
    // --- VALIDAÇÃO DE CPF (front-end) ---
    const cpfInput = document.getElementById('cpf');
    const cpfValue = cpfInput.value || '';
    // Se a função isValidCPF estiver disponível (foi adicionada em validateCpf.js), use-a
    if (typeof window.isValidCPF === 'function') {
        if (!window.isValidCPF(cpfValue)) {
            alert('CPF inválido. Verifique o número e tente novamente.');
            cpfInput.focus();
            return;
        }
    }

    // Formata visualmente o CPF (opcional)
    if (typeof window.formatCPF === 'function') {
        cpfInput.value = window.formatCPF(cpfValue);
    }

    const termosAceitos = document.getElementById('termos').checked;
    if (!termosAceitos) {
        alert("Você precisa ler e aceitar os Termos de Uso e Contrato para continuar.");
        return;
    }

    // Captura dados básicos (AGORA INCLUINDO O CUPOM)
    const dadosBasicos = {
        name: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('telefone').value,
        cpf: document.getElementById('cpf').value,
        modality: document.getElementById('modalidade').value,
        paymentMethod: document.getElementById('pagamento').value,
        // Captura o cupom, verificando se o elemento existe para evitar erros
        coupon: document.getElementById('input-cupom') ? document.getElementById('input-cupom').value : ''
    };

    if (!dadosBasicos.modality) return alert("Selecione a modalidade!");

    // --- VALIDAÇÃO DO CUPOM ---
    const cupomDigitado = (dadosBasicos.coupon || '').trim().toUpperCase();
    if (cupomDigitado) {
        const couponData = await fetchCouponData(cupomDigitado);
        if (!couponData) {
            alert("❌ Cupom inválido! Verifique-o e tente novamente.");
            return;
        }
    }

    // Limpa intervalo anterior se existir
    if (intervaloVerificacao) clearInterval(intervaloVerificacao);

    // --- PRE-CHECK: Verifica inscrição existente para avisar antes de trocar modalidade ---
    try {
        const cpfClean = (dadosBasicos.cpf || '').replace(/\D/g, '');
        if (cpfClean) {
            const check = await fetch(`${API_BASE_URL}/api/enrollment/existing?cpf=${cpfClean}`);
            if (check.ok) {
                const info = await check.json();
                if (info.exists && info.status === 'PENDING' && info.paymentId) {
                    const confirmMsg = 'Existe uma cobrança pendente. Se os dados desta tentativa forem diferentes, a cobrança anterior será cancelada antes de criar outra. Deseja continuar?';
                    if (!(await showConfirmModal(confirmMsg))) return;
                }
            }
        }
    } catch (err) {
        console.warn('Erro ao checar inscrição existente:', err.message);
        // não bloqueia o fluxo
    }

    // --- LÓGICA DO CARTÃO DE CRÉDITO ---
    if (dadosBasicos.paymentMethod === 'cartao') {
        clearTimeout(installmentRefreshTimer);
        await refreshCardInstallments();
        const installmentOption = document.getElementById('parcelas').selectedOptions[0];
        if (!paymentMethodId || !selectedCardBin || !installmentOption?.dataset.issuerId) {
            return alert("Informe um cartão e aguarde a consulta das parcelas sem acréscimo.");
        }

        try {
            const expiracao = document.getElementById('cardExpiration').value;

            // Valida formato da data antes de tentar processar
            if (!expiracao.includes('/') || expiracao.length !== 5) {
                alert("Data de validade inválida. Digite todos os números.");
                return;
            }

            const cardData = {
                cardNumber: document.getElementById('cardNumber').value.replace(/\s/g, ''), // Tira espaços
                cardholderName: document.getElementById('cardholderName').value,
                cardExpirationMonth: expiracao.split('/')[0],
                cardExpirationYear: '20' + expiracao.split('/')[1], // Assume ano 20xx
                securityCode: document.getElementById('securityCode').value,
                identification: {
                    type: 'CPF',
                    number: dadosBasicos.cpf.replace(/\D/g, '') // Apenas números do CPF
                }
            };

            // GERA O TOKEN SEGURO COM O MERCADO PAGO
            const tokenResponse = await mp.createCardToken(cardData);

            // Anexa dados de pagamento ao objeto de envio
            dadosBasicos.token = tokenResponse.id;
            dadosBasicos.installments = Number(installmentOption.dataset.installments);
            dadosBasicos.paymentMethodId = paymentMethodId;
            dadosBasicos.cardBin = selectedCardBin;
            dadosBasicos.issuerId = installmentOption.dataset.issuerId;

            await enviarParaBackend(dadosBasicos);

        } catch (error) {
            console.error("Erro no cartão:", error);
            // Mensagem amigável para o usuário
            const msg = error.message || "Verifique número, validade e CVV.";
            alert("Não foi possível processar o cartão: " + msg);
        }
    }
    // --- LÓGICA DO PIX / BOLETO ---
    else {
        dadosBasicos.installments = 1;
        await enviarParaBackend(dadosBasicos);
    }
}

// FUNÇÃO DE ENVIO PARA O SERVIDOR
async function enviarParaBackend(payload) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/enrollment/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const resultado = await response.json();

        // 409 -> Já pago
        if (response.status === 409) {
            if (resultado.status === 'approved') {
                alert('Este pagamento já foi aprovado. Você será direcionado para o curso.');
                window.location.href = "/";
                return;
            }
            alert(resultado.error || 'Usuário já possui inscrição paga.');
            return;
        }

        if (!response.ok) {
            alert('Erro: ' + (resultado.error || 'Erro desconhecido'));
            return;
        }

        if (resultado.resume) {
            if (resultado.paymentMethod === 'cartao') {
                mostrarStatusCartao(resultado);
            } else {
                mostrarPix(resultado);
            }
            return;
        }

        if (payload.paymentMethod === 'pix') {
            mostrarPix(resultado);
        } else if (payload.paymentMethod === 'cartao') {
            if (resultado.status === 'approved') {
                alert("Pagamento Aprovado com Sucesso! Bem-vindo(a) ao curso.");
                window.location.href = "/";
            } else {
                mostrarStatusCartao(resultado);
            }
        }

    } catch (error) {
        console.error(error);
        alert('Erro de conexão com o servidor.');
    }
}

function mostrarStatusCartao(resultado) {
    const qrBox = document.querySelector('.qr-placeholder');
    qrBox.textContent = `Pagamento no cartão ${resultado.status === 'approved' ? 'aprovado' : 'em processamento'}: ${resultado.status || 'aguardando confirmação'}.`;
    qrBox.style.opacity = '1';
    qrBox.style.border = '2px solid #39ff14';

    if (resultado.paymentId && resultado.status !== 'approved') {
        startPaymentPolling(resultado.paymentId);
    }
}

function startPaymentPolling(paymentId) {
    if (intervaloVerificacao) clearInterval(intervaloVerificacao);
    let checking = false;

    intervaloVerificacao = setInterval(async () => {
        if (checking) return;
        checking = true;
        try {
            const response = await fetch(`${API_BASE_URL}/api/enrollment/status/${encodeURIComponent(paymentId)}`);
            const statusResult = await response.json();
            if (statusResult.status === 'approved') {
                clearInterval(intervaloVerificacao);
                intervaloVerificacao = null;
                alert('Pagamento confirmado! Bem-vindo(a) ao curso.');
                window.location.href = "/";
            } else if (['rejected', 'cancelled', 'refunded', 'amount_mismatch', 'not_current_payment'].includes(statusResult.status)) {
                clearInterval(intervaloVerificacao);
                intervaloVerificacao = null;
                document.querySelector('.qr-placeholder').textContent =
                    statusResult.status === 'amount_mismatch'
                        ? 'O valor do pagamento não corresponde ao preço informado. Entre em contato com o suporte.'
                        : 'Esta tentativa de pagamento foi encerrada. Você pode iniciar uma nova tentativa.';
            }
        } catch (error) {
            console.error('Erro ao verificar status do pagamento:', error);
        } finally {
            checking = false;
        }
    }, 3000);
}

function mostrarPix(resultado) {
    const { qrCodeBase64, qrCodeCopyPaste } = resultado.payment;
    const { paymentId, valor } = resultado;
    const qrBox = document.querySelector('.qr-placeholder');

    qrBox.innerHTML = `
        <div style="text-align: center; gap: 15px; display: flex; flex-direction: column; align-items: center;">
            <h4 style="color: #fff;">Valor: <strong style="color: #39ff14;">${formatarReal(valor)}</strong></h4>
            <p style="color:#39ff14; font-weight:bold;">Escaneie o QR Code:</p>
            <img src="data:image/png;base64,${qrCodeBase64}" style="width:200px; border-radius:10px; border: 4px solid white;">
            <textarea readonly style="width:100%; margin-top:10px; background: #222; color: #fff; padding: 10px; border-radius: 5px;">${qrCodeCopyPaste}</textarea>
        </div>
    `;
    qrBox.style.opacity = "1";
    qrBox.style.border = "2px solid #39ff14";

    startPaymentPolling(paymentId);
}


// --- LÓGICA DO MODAL DE CONTRATO ---
const modal = document.getElementById('modal-contrato');
const btnAbrir = document.getElementById('btn-abrir-contrato');
const btnFechar = document.querySelector('.btn-fechar-modal');
const spanFechar = document.querySelector('.close-modal');

// Abrir Modal
btnAbrir.addEventListener('click', (e) => {
    e.preventDefault(); // Impede o link de recarregar a página
    modal.style.display = 'flex'; // Mostra o modal (flex para centralizar)
});

// Fechar Modal (Botão Inferior)
btnFechar.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Fechar Modal (X no canto)
spanFechar.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Fechar se clicar fora da caixa (no fundo escuro)
window.addEventListener('click', (e) => {
    if (e.target == modal) {
        modal.style.display = 'none';
    }
});

// Inicializa preview do cupom e listeners associados
document.addEventListener('DOMContentLoaded', () => {
    const cupInput = document.getElementById('input-cupom');
    const parcelasEl = document.getElementById('parcelas');
    const modalidadeEl = document.getElementById('modalidade');
    const pagamentoEl = document.getElementById('pagamento');

    if (cupInput) cupInput.addEventListener('input', updateCouponPreview);
    if (parcelasEl) parcelasEl.addEventListener('change', updateCouponPreview);
    if (modalidadeEl) modalidadeEl.addEventListener('change', () => {
        updateCouponPreview();
        if (selectedCardBin) refreshCardInstallments();
    });
    if (pagamentoEl) pagamentoEl.addEventListener('change', updateCouponPreview);

    // chamada inicial caso tenha valor preenchido ao carregar
    setTimeout(updateCouponPreview, 200);
});