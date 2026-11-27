import { createHash, randomUUID } from 'node:crypto';
import { MercadoPagoConfig, Payment, PaymentRefund } from 'mercadopago';
// Imports fs/path removed

import { signAccess, signRefresh, ACCESS_EXPIRES, REFRESH_EXPIRES } from '../utils/jwt.js';
import { sendWelcomeEmail, sendCredentialsEmail } from '../services/emailService.js';
import prisma from '../db.js';
import { fetchNoInterestInstallments } from '../utils/installments.js';
import { applyCoupon, getBasePrice, normalizeCouponCode } from '../utils/paymentPricing.js';
import {
    cancelPendingPayment,
    hasExactPaymentTotal,
    isPendingPaymentStatus,
    isSamePaymentIntent,
    isTerminalPaymentStatus
} from '../utils/paymentAttempts.js';
import { recoverPaymentAttempt } from '../utils/paymentAttemptRecovery.js';
import { matchesInstallmentSelection } from '../utils/paymentTerms.js';
import {
    PaymentLockUnavailableError,
    withEnrollmentPaymentLock
} from '../utils/paymentLocks.js';

async function countVimeoIds() {
  try {
     const count = await prisma.videoLesson.count({
        where: {
            AND: [
                { vimeoId: { not: "" } },
                { vimeoId: { not: null } }
            ]
        }
    });
    return count;
  } catch (e) {
    console.error('Erro ao contar aulas (enrollmentController):', e);
    return 52; 
  }
}

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
    options: { timeout: 5000 }
});

async function calcularValorCobrado(modality, couponCode, database = prisma) {
    const basePrice = getBasePrice(modality);
    if (!couponCode) return basePrice;

    const normalizedCode = normalizeCouponCode(couponCode);
    if (!normalizedCode) throw new RangeError('Cupom inválido.');

    const coupon = await database.coupon.findUnique({ where: { code: normalizedCode } });
    if (!coupon) throw new RangeError('Cupom inválido.');

    return applyCoupon(basePrice, coupon);
}

export const getInstallments = async (req, res) => {
    try {
        const { bin, modality, coupon, paymentMethodId } = req.query;
        if (!/^\d{6}$/.test(String(bin || '')) || !paymentMethodId) {
            return res.status(400).json({ error: 'BIN ou bandeira inválida.' });
        }

        const amount = await calcularValorCobrado(modality, coupon);
        const options = await fetchNoInterestInstallments({
            accessToken: process.env.MP_ACCESS_TOKEN,
            bin: String(bin),
            amount,
            paymentMethodId: String(paymentMethodId)
        });

        return res.json({ amount, options });
    } catch (error) {
        const status = error instanceof RangeError ? 400 : 502;
        console.error('[getInstallments] Falha ao consultar parcelas:', error.message);
        return res.status(status).json({ error: error.message || 'Não foi possível consultar parcelas.' });
    }
};

function cents(amount) {
    return Math.round(Number(amount) * 100);
}

function hashPaymentIdentifier(type, value) {
    return createHash('sha256').update(`${type}:${value}`).digest('hex');
}

function getPaymentAttemptStatus(paymentStatus) {
    if (paymentStatus === 'approved') return 'APPROVED';
    if (isPendingPaymentStatus(paymentStatus)) return 'PENDING';
    if (paymentStatus === 'rejected') return 'REJECTED';
    if (paymentStatus === 'cancelled') return 'CANCELLED';
    if (paymentStatus === 'refunded') return 'REFUNDED';
    return 'UNKNOWN';
}

async function cancelUnexpectedPayment(payment, paymentId, status) {
    if (isPendingPaymentStatus(status)) {
        await cancelPendingPayment(payment, paymentId);
        return true;
    }

    if (status === 'approved') {
        const refunds = await new PaymentRefund(client).list({ payment_id: paymentId });
        const existingRefund = refunds.find((refund) =>
            ['approved', 'pending'].includes(refund.status)
        );
        const refund = existingRefund ||
            await new PaymentRefund(client).create({ payment_id: paymentId });
        if (!['approved', 'pending'].includes(refund.status)) {
            throw new Error('Mercado Pago não confirmou o estorno da cobrança divergente.');
        }
        return refund.status === 'approved';
    }

    if (isTerminalPaymentStatus(status)) return true;

    throw new Error('O pagamento precisa ser cancelado ou estornado pelo Mercado Pago.');
}

async function processEnrollment(req, res, database, postCommitActions, paymentOperation) {
    try {
        const {
            name, email, cpf, phone, modality, paymentMethod, installments,
            token, paymentMethodId, cardBin, issuerId, coupon
        } = req.body;

        if (!name || !email || !cpf || !phone) {
            return res.status(400).json({ error: 'Informe nome, e-mail, CPF e telefone.' });
        }
        if (!['COM_MATERIAL', 'SEM_MATERIAL'].includes(modality)) {
            return res.status(400).json({ error: 'Modalidade inválida.' });
        }
        if (!['cartao', 'pix'].includes(paymentMethod)) {
            return res.status(400).json({ error: 'Forma de pagamento inválida.' });
        }

        const amount = await calcularValorCobrado(modality, coupon, database);
        const cleanCpf = String(cpf).replace(/\D/g, '');
        const normalizedEmail = String(email).trim().toLowerCase();
        const normalizedPhone = String(phone).replace(/\D/g, '');
        const emailHash = hashPaymentIdentifier('email', normalizedEmail);
        const cpfHash = hashPaymentIdentifier('cpf', cleanCpf);
        const payment = new Payment(client);
        let selectedInstallment = null;

        if (paymentMethod === 'cartao') {
            const count = Number(installments);
            const issuer = String(issuerId || '');
            const bin = String(cardBin || '');
            if (!token || !paymentMethodId || !/^\d{6}$/.test(bin) ||
                !/^\d+$/.test(issuer) || !Number.isInteger(count) || count < 1 || count > 12) {
                return res.status(400).json({ error: 'Dados do cartão ou parcelamento inválidos.' });
            }

            const availableOptions = await fetchNoInterestInstallments({
                accessToken: process.env.MP_ACCESS_TOKEN,
                bin,
                amount,
                paymentMethodId: String(paymentMethodId)
            });
            selectedInstallment = availableOptions.find((option) =>
                option.issuerId === issuer && option.installments === count
            );
            if (!selectedInstallment) {
                return res.status(400).json({
                    error: 'Este cartão não possui essa opção de parcelamento sem acréscimo. Atualize as parcelas e tente novamente.'
                });
            }
        }

        const alunoExistente = await database.enrollment.findFirst({
            where: { OR: [{ email: normalizedEmail }, { cpf: cleanCpf }] }
        });
        if (alunoExistente && ['PAID', 'ADMIN'].includes(alunoExistente.status)) {
            return res.status(409).json({ error: 'Usuário já possui inscrição paga.' });
        }

        if (alunoExistente?.paymentId) {
            let existingPayment;
            try {
                existingPayment = await payment.get({ id: alunoExistente.paymentId });
            } catch (error) {
                console.error('[createEnrollment] Não foi possível consultar pagamento anterior:', error.code || error.name);
                return res.status(502).json({
                    error: 'Não foi possível verificar a cobrança anterior. Nenhuma nova cobrança foi criada.'
                });
            }

            if (existingPayment.status === 'approved') {
                if (cents(existingPayment.transaction_amount) !== cents(alunoExistente.amount) ||
                    !hasExactPaymentTotal(existingPayment, alunoExistente.amount, true)) {
                    try {
                        const paymentResolved = await cancelUnexpectedPayment(
                            payment,
                            alunoExistente.paymentId,
                            existingPayment.status
                        );
                        if (!paymentResolved) {
                            return res.status(409).json({
                                error: 'O estorno da cobrança anterior ainda está em processamento. Aguarde a confirmação antes de tentar novamente.'
                            });
                        }
                        await database.enrollment.update({
                            where: { id: alunoExistente.id },
                            data: { status: 'REJECTED', paymentId: null }
                        });
                        await database.paymentAttempt.updateMany({
                            where: { paymentId: alunoExistente.paymentId },
                            data: { status: 'REFUNDED' }
                        });
                        alunoExistente.status = 'REJECTED';
                        alunoExistente.paymentId = null;
                    } catch (error) {
                        console.error('[createEnrollment] Não foi possível estornar a cobrança anterior divergente:', error.code || error.message);
                        return res.status(502).json({
                            error: 'Existe uma cobrança aprovada com valor divergente e não foi possível confirmar o estorno. Entre em contato com o suporte antes de tentar novamente.'
                        });
                    }
                } else {
                    await database.enrollment.update({
                        where: { id: alunoExistente.id },
                        data: { status: 'PAID' }
                    });
                    await database.paymentAttempt.updateMany({
                        where: { paymentId: alunoExistente.paymentId },
                        data: { status: 'APPROVED' }
                    });
                    postCommitActions.push({
                        email: alunoExistente.email,
                        name: alunoExistente.name,
                        failRequestOnError: true
                    });
                    return res.status(200).json({ status: 'approved', message: 'Pagamento anterior já aprovado.' });
                }
            }

            if (isPendingPaymentStatus(existingPayment.status)) {
                const sameIntent = alunoExistente.modality === modality &&
                    isSamePaymentIntent(existingPayment, {
                        amount,
                        modality,
                        paymentMethod,
                        paymentMethodId,
                        issuerId,
                        installments: paymentMethod === 'cartao' ? Number(installments) : 1
                    }) &&
                    (paymentMethod !== 'cartao' ||
                        hasExactPaymentTotal(existingPayment, amount, false));

                if (sameIntent) {
                    return res.status(200).json({
                        resume: true,
                        paymentId: alunoExistente.paymentId,
                        status: existingPayment.status,
                        valor: amount,
                        paymentMethod,
                        payment: {
                            qrCodeBase64: existingPayment.point_of_interaction?.transaction_data?.qr_code_base64,
                            qrCodeCopyPaste: existingPayment.point_of_interaction?.transaction_data?.qr_code
                        }
                    });
                }

                try {
                    await cancelPendingPayment(payment, alunoExistente.paymentId);
                    await database.paymentAttempt.updateMany({
                        where: { paymentId: alunoExistente.paymentId },
                        data: { status: 'CANCELLED' }
                    });
                } catch (error) {
                    console.error('[createEnrollment] Cobrança anterior não cancelada:', error.code || error.message);
                    return res.status(409).json({
                        error: 'Não foi possível cancelar a cobrança anterior. A nova tentativa não foi criada para evitar cobranças duplicadas.'
                    });
                }
            } else if (!isTerminalPaymentStatus(existingPayment.status)) {
                return res.status(409).json({
                    error: 'A cobrança anterior está em um estado que não permite uma nova tentativa com segurança.'
                });
            } else {
                await database.paymentAttempt.updateMany({
                    where: { paymentId: alunoExistente.paymentId },
                    data: { status: getPaymentAttemptStatus(existingPayment.status) }
                });
            }
        }

        const activeAttempts = await database.paymentAttempt.findMany({
            where: {
                status: { in: ['PROCESSING', 'UNKNOWN', 'PENDING', 'APPROVED', 'REFUND_PENDING'] },
                OR: [{ emailHash }, { cpfHash }]
            },
            orderBy: { createdAt: 'desc' },
            take: 2
        });
        if (activeAttempts.length > 1) {
            return res.status(409).json({
                error: 'Há mais de uma tentativa de pagamento não resolvida para este cadastro. Nenhuma nova cobrança foi criada; contate o suporte.'
            });
        }

        let attempt = activeAttempts[0] || null;
        let enrollment;
        let paymentData;

        if (attempt) {
            if (alunoExistente && alunoExistente.id !== attempt.enrollmentId) {
                return res.status(409).json({
                    error: 'Existe uma tentativa de pagamento não resolvida associada a outro cadastro. Nenhuma nova cobrança foi criada; contate o suporte.'
                });
            }

            const attemptEnrollmentData = {
                modality: attempt.modality,
                amount: attempt.amount,
                status: 'PENDING',
                paymentId: attempt.paymentId
            };
            enrollment = alunoExistente
                ? await database.enrollment.update({
                    where: { id: alunoExistente.id },
                    data: attemptEnrollmentData
                })
                : await database.enrollment.create({
                    data: {
                        id: attempt.enrollmentId,
                        name: String(name).trim(),
                        email: normalizedEmail,
                        cpf: cleanCpf,
                        phone: normalizedPhone,
                        ...attemptEnrollmentData
                    }
                });

            paymentOperation.value = { attempt, enrollment, recover: true };
            return;
        } else {
            const enrollmentData = {
                name: String(name).trim(),
                email: normalizedEmail,
                cpf: cleanCpf,
                phone: normalizedPhone,
                modality,
                amount,
                status: 'PENDING',
                paymentId: null
            };
            enrollment = alunoExistente
                ? await database.enrollment.update({ where: { id: alunoExistente.id }, data: enrollmentData })
                : await database.enrollment.create({ data: enrollmentData });

            paymentData = {
                transaction_amount: amount,
                description: `Curso Matemática - ${modality}`,
                external_reference: randomUUID(),
                payer: {
                    email: normalizedEmail,
                    first_name: enrollmentData.name.split(/\s+/)[0],
                    identification: { type: 'CPF', number: cleanCpf }
                },
                metadata: { name: enrollmentData.name, email: normalizedEmail, cpf: cleanCpf, phone: normalizedPhone, modality, alunoId: enrollment.id }
            };

            if (paymentMethod === 'cartao') {
                paymentData.token = token;
                paymentData.installments = selectedInstallment.installments;
                paymentData.payment_method_id = String(paymentMethodId);
                paymentData.issuer_id = Number(selectedInstallment.issuerId);
                paymentData.metadata.installments = selectedInstallment.installments;
                paymentData.metadata.paymentMethodId = String(paymentMethodId);
                paymentData.metadata.issuerId = String(selectedInstallment.issuerId);
            } else {
                paymentData.payment_method_id = 'pix';
            }

            attempt = await database.paymentAttempt.create({
                data: {
                    id: paymentData.external_reference,
                    enrollmentId: enrollment.id,
                    emailHash,
                    cpfHash,
                    modality,
                    amount,
                    paymentMethod,
                    installments: paymentMethod === 'cartao' ? selectedInstallment.installments : null,
                    paymentMethodId: paymentMethod === 'cartao' ? String(paymentMethodId) : null,
                    issuerId: paymentMethod === 'cartao' ? String(selectedInstallment.issuerId) : null,
                    idempotencyKey: randomUUID(),
                    externalReference: paymentData.external_reference,
                    status: 'PROCESSING'
                }
            });
            paymentOperation.value = { attempt, enrollment, paymentData, recover: false };
            return;
        }
        throw new Error('A preparação da tentativa de pagamento não produziu uma operação.');
    } catch (error) {
        console.error('[createEnrollment] Erro ao processar pagamento:', error.code || error.message);
        const status = error instanceof RangeError ? 400 : 500;
        return res.status(status).json({ error: error.message || 'Erro ao processar pagamento.' });
    }
}

async function completePaymentAttempt(operation, postCommitActions) {
    const { attempt, enrollment, paymentData, recover } = operation;
    let activePaymentId = null;
    const payment = new Payment(client);

    try {
        const mpResponse = recover
            ? await recoverPaymentAttempt(payment, attempt)
            : await payment.create({
                body: paymentData,
                requestOptions: { idempotencyKey: attempt.idempotencyKey }
            });
        if (!mpResponse.id) {
            throw new Error('Mercado Pago retornou uma cobrança sem identificador.');
        }

        activePaymentId = String(mpResponse.id);
        await prisma.paymentAttempt.update({
            where: { id: attempt.id },
            data: {
                paymentId: activePaymentId,
                status: getPaymentAttemptStatus(mpResponse.status)
            }
        });
        await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: { paymentId: activePaymentId }
        });

        if (mpResponse.status === 'rejected') {
            await prisma.enrollment.update({
                where: { id: enrollment.id },
                data: { status: 'REJECTED' }
            });
            await prisma.paymentAttempt.update({
                where: { id: attempt.id },
                data: { status: 'REJECTED' }
            });
            return {
                status: 400,
                body: { error: 'Pagamento rejeitado pelo banco. Verifique os dados ou limite.' }
            };
        }

        if (attempt.paymentMethod === 'cartao') {
            const paymentTermsMatch = matchesInstallmentSelection(mpResponse, {
                installments: attempt.installments,
                paymentMethodId: attempt.paymentMethodId,
                issuerId: attempt.issuerId
            });
            const paymentAmountMatches =
                cents(mpResponse.transaction_amount) === cents(attempt.amount) &&
                hasExactPaymentTotal(mpResponse, attempt.amount, mpResponse.status === 'approved');
            if (!paymentTermsMatch || !paymentAmountMatches) {
                let paymentResolved = false;
                try {
                    paymentResolved = await cancelUnexpectedPayment(payment, activePaymentId, mpResponse.status);
                } catch (error) {
                    console.error('[createEnrollment] Falha ao reverter cobrança com total divergente:', error.code || error.message);
                }

                await prisma.enrollment.update({
                    where: { id: enrollment.id },
                    data: {
                        status: 'REJECTED',
                        ...(paymentResolved ? { paymentId: null } : {})
                    }
                });
                await prisma.paymentAttempt.update({
                    where: { id: attempt.id },
                    data: { status: paymentResolved ? 'REFUNDED' : 'REFUND_PENDING' }
                });

                if (!paymentResolved && mpResponse.status === 'approved') {
                    return {
                        status: 202,
                        body: {
                            paymentId: activePaymentId,
                            status: 'refund_pending',
                            paymentMethod: attempt.paymentMethod,
                            valor: attempt.amount
                        }
                    };
                }

                return {
                    status: 502,
                    body: {
                        error: 'O Mercado Pago retornou parcelas ou um total diferente do solicitado. A cobrança foi interrompida ou enviada para estorno; contate o suporte se ela aparecer na fatura.'
                    }
                };
            }
        }

        if (mpResponse.status === 'approved') {
            await prisma.enrollment.update({
                where: { id: enrollment.id },
                data: { status: 'PAID' }
            });
            await prisma.paymentAttempt.update({
                where: { id: attempt.id },
                data: { status: 'APPROVED' }
            });
            postCommitActions.push({
                email: enrollment.email,
                name: enrollment.name,
                failRequestOnError: false
            });
        }

        return {
            status: 201,
            body: {
                success: true,
                paymentId: activePaymentId,
                status: mpResponse.status,
                valor: attempt.amount,
                paymentMethod: attempt.paymentMethod,
                payment: {
                    qrCodeBase64: mpResponse.point_of_interaction?.transaction_data?.qr_code_base64,
                    qrCodeCopyPaste: mpResponse.point_of_interaction?.transaction_data?.qr_code
                }
            }
        };
    } catch (error) {
        console.error('[createEnrollment] Erro ao processar tentativa de pagamento:', error.code || error.message);
        try {
            await prisma.paymentAttempt.update({
                where: { id: attempt.id },
                data: { status: 'UNKNOWN' }
            });
        } catch (attemptError) {
            console.error('[createEnrollment] Não foi possível atualizar o estado da tentativa:', attemptError.code || attemptError.message);
        }

        if (activePaymentId) {
            try {
                const current = await payment.get({ id: activePaymentId });
                if (isPendingPaymentStatus(current.status)) {
                    await cancelPendingPayment(payment, activePaymentId);
                    await prisma.paymentAttempt.update({
                        where: { id: attempt.id },
                        data: { status: 'CANCELLED' }
                    });
                }
            } catch (cancelError) {
                console.error('[createEnrollment] Não foi possível encerrar cobrança criada sem confirmação:', cancelError.code || cancelError.message);
            }
        }

        return {
            status: 503,
            body: {
                error: 'Não foi possível confirmar o resultado do pagamento. A tentativa foi preservada para reconciliação; não tente pagar novamente nem faça outro pagamento.'
            }
        };
    }
}

export const createEnrollment = async (req, res) => {
    const { email, cpf } = req.body || {};
    if (!email || !cpf) return processEnrollment(req, res, prisma);

    const normalizedEmail = String(email).trim().toLowerCase();
    const cleanCpf = String(cpf).replace(/\D/g, '');
    const identifiers = [
        `email:${normalizedEmail || String(email)}`,
        `cpf:${cleanCpf || String(cpf)}`
    ];
    let responseStatus = 200;
    let responseBody;
    const postCommitActions = [];
    const paymentOperation = { value: null };
    const deferredResponse = {
        status(status) {
            responseStatus = status;
            return this;
        },
        json(body) {
            responseBody = body;
            return this;
        }
    };

    try {
        await withEnrollmentPaymentLock(prisma, identifiers, (transaction) =>
            processEnrollment(req, deferredResponse, transaction, postCommitActions, paymentOperation)
        );
    } catch (error) {
        if (error instanceof PaymentLockUnavailableError) {
            return res.status(409).json({
                error: 'Outra tentativa de pagamento está em andamento. Aguarde e tente novamente.'
            });
        }
        console.error('[createEnrollment] Falha ao proteger a tentativa de pagamento:', error.code || error.message);
        return res.status(503).json({
            error: 'Não foi possível iniciar a tentativa de pagamento com segurança. Tente novamente.'
        });
    }

    if (paymentOperation.value) {
        const result = await completePaymentAttempt(paymentOperation.value, postCommitActions);
        responseStatus = result.status;
        responseBody = result.body;
    }

    for (const action of postCommitActions) {
        try {
            await sendWelcomeEmail(action.email, action.name);
        } catch (error) {
            console.error('[createEnrollment] Pagamento aprovado, mas o e-mail não foi enviado:', error.message);
            if (action.failRequestOnError) {
                return res.status(500).json({ error: error.message || 'Erro ao enviar e-mail de boas-vindas.' });
            }
        }
    }

    return res.status(responseStatus).json(responseBody);
};

export const checkPaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const enrollment = await prisma.enrollment.findFirst({ where: { paymentId: id } });
        if (!enrollment) {
            return res.status(404).json({ status: 'not_current_payment' });
        }

        const paymentInfo = await new Payment(client).get({ id });
        if (paymentInfo.status !== 'approved') {
            if (isTerminalPaymentStatus(paymentInfo.status)) {
                await prisma.paymentAttempt.updateMany({
                    where: { paymentId: id },
                    data: { status: getPaymentAttemptStatus(paymentInfo.status) }
                });
            }
            return res.json({ status: paymentInfo.status });
        }

        const transactionAmountMatches =
            cents(paymentInfo.transaction_amount) === cents(enrollment.amount);
        const totalPaidMatches = hasExactPaymentTotal(paymentInfo, enrollment.amount, true);
        const recordedInstallmentCount = Number(paymentInfo.metadata?.installments);
        const paymentTermsMatch = paymentInfo.payment_type_id !== 'credit_card' ||
            !Number.isInteger(recordedInstallmentCount) ||
            matchesInstallmentSelection(paymentInfo, {
                installments: recordedInstallmentCount,
                paymentMethodId: paymentInfo.metadata.paymentMethodId,
                issuerId: paymentInfo.metadata.issuerId
            });

        if (!transactionAmountMatches || !totalPaidMatches || !paymentTermsMatch) {
            console.error('[checkPaymentStatus] Pagamento aprovado com valor ou parcelas divergentes; matrícula não liberada.');
            try {
                const paymentResolved = await cancelUnexpectedPayment(
                    new Payment(client),
                    id,
                    paymentInfo.status
                );
                if (paymentResolved) {
                    await prisma.enrollment.update({
                        where: { id: enrollment.id },
                        data: { status: 'REJECTED', paymentId: null }
                    });
                    await prisma.paymentAttempt.updateMany({
                        where: { paymentId: id },
                        data: { status: 'REFUNDED' }
                    });
                    return res.status(409).json({ status: 'amount_mismatch' });
                }
                await prisma.paymentAttempt.updateMany({
                    where: { paymentId: id },
                    data: { status: 'REFUND_PENDING' }
                });
                return res.status(202).json({ status: 'refund_pending' });
            } catch (error) {
                console.error('[checkPaymentStatus] Falha ao estornar pagamento divergente:', error.code || error.message);
                await prisma.paymentAttempt.updateMany({
                    where: { paymentId: id },
                    data: { status: 'REFUND_PENDING' }
                });
                return res.status(502).json({ status: 'refund_pending', error: 'Não foi possível confirmar o estorno da cobrança divergente.' });
            }
        }

        await prisma.paymentAttempt.updateMany({
            where: { paymentId: id },
            data: { status: 'APPROVED' }
        });
        if (['PAID', 'ADMIN'].includes(enrollment.status)) {
            return res.json({ status: 'approved', message: 'Pagamento já processado.' });
        }

        await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: { status: 'PAID' }
        });
        try {
            await sendWelcomeEmail(enrollment.email, enrollment.name);
        } catch (error) {
            console.error('[checkPaymentStatus] Pagamento aprovado, mas o e-mail não foi enviado:', error.message);
        }

        return res.json({ status: 'approved', message: 'Matrícula confirmada.' });
    } catch (error) {
        console.error('[checkPaymentStatus] Erro ao consultar pagamento:', error.code || error.message);
        return res.status(500).json({ error: 'Erro ao consultar pagamento.' });
    }
};

//no cadastro, verifica se já existe inscrição com cpf ou email
export const getExistingEnrollment = async (req, res) => {
    try {
        const { cpf, email } = req.query;
        if (!cpf && !email) return res.status(400).json({ error: 'cpf or email required' });

        const cpfLimpo = cpf ? String(cpf).replace(/\D/g, '') : undefined;

        const found = await prisma.enrollment.findFirst({
            where: { OR: [{ email: email || undefined }, { cpf: cpfLimpo || undefined }] }
        });

        if (!found) return res.json({ exists: false });

        return res.json({
            exists: true,
            status: found.status,
            modality: found.modality,
            paymentId: found.paymentId || null,
            amount: found.amount || null
        });
    } catch (err) {
        console.error('[getExistingEnrollment] Erro:', err.message);
        res.status(500).json({ error: 'Erro ao consultar inscrição existente' });
    }
};


//Verificação de Login


export const verifyLogin = async (req, res) => {
    try {
        const { email, pass } = req.body;

        if (!email) return res.status(400).json({ error: "E-mail é obrigatório." });
        if (pass === undefined || pass === null) return res.status(400).json({ error: "Senha é obrigatória." });

        const user = await prisma.enrollment.findUnique({ where: { email: email }});
        if (!user) {
            return res.status(404).json({ error: "E-mail não encontrado." })
        };

        // Remove formatação do CPF antes de comparar
        const passLimpo = String(pass).replace(/\D/g, '');
        if (user.cpf !== passLimpo) {
            return res.status(401).json({ error: "Senha incorreta." });
        };
                
        if (!user.status || !['PAID','ADMIN'].includes(user.status)) {
            return res.status(403).json({ error: "Seu pagamento ainda não foi confirmado." });
        }

        // Atualizar Último Acesso
        try {
            await prisma.enrollment.update({ where: { id: user.id }, data: { lastAccess: new Date() } });
        } catch(e) { console.error('Error updating lastAccess', e); }

        // Gerar tokens e setar cookies para compatibilidade com novo fluxo
        const accessToken = signAccess(user.id);
        const refreshToken = signRefresh(user.id);
        const secure = process.env.NODE_ENV === 'production';

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure,
            sameSite: 'lax',
            maxAge: ACCESS_EXPIRES * 1000,
            path: '/'
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure,
            sameSite: 'lax',
            maxAge: REFRESH_EXPIRES * 1000,
            path: '/'
        });

        return res.status(200).json({ 
            success: true, 
            message: "Login bem-sucedido.",
            userId: user.id,
            userName: user.name,
            status: user.status,
            modality: user.modality // Retornar modalidade para o frontend usar
        });
    }
    catch (err) {
        console.error('[verifyLogin] Erro:', err.message);
        console.error(err.stack); // Log do stack trace
        res.status(500).json({ error: 'Erro ao verificar login', details: err.message });
    }
};

// Lista alunos com status PAID (para uso no painel administrativo)
export const listPaidEnrollments = async (req, res) => {
    try {
        const q = req.query.q ? String(req.query.q).trim() : '';
        const modality = req.query.modality ? String(req.query.modality).trim() : '';
        const classDay = req.query.classDay ? String(req.query.classDay).trim() : '';

        // Base: sempre filtrar por status PAID ou ADMIN
        let whereClause = { status: { in: ['PAID','ADMIN'] } };

        // Se houver busca por nome, adicionar OR
        if (q) {
            whereClause.OR = [
                { name: { startsWith: q } },
                { name: { contains: ' ' + q } }
            ];
        }

        // Se modalidade fornecida, adicionar filtro (AND)
        if (modality) {
            whereClause.modality = modality;
        }

        // Se dia da aula fornecido, adicionar filtro (AND)
        if (classDay) {
            whereClause.classDay = classDay;
        }

        const students = await prisma.enrollment.findMany({
            where: whereClause,
            orderBy: { name: 'asc' },
            take: 200,
            select: {
                id: true,
                name: true,
                email: true,
                cpf: true,
                phone: true,
                modality: true,
                amount: true,
                createdAt: true,
                lastAccess: true,
                classDay: true
            }
        });

        // Compute real lessons-watched percentage per student
        const ids = students.map(s => s.id);

        // Determine total lessons (dynamically)
        const totalLessons = await countVimeoIds();

        let completedMap = {};
        if (ids.length > 0) {
            try {
                const grouped = await prisma.lessonProgress.groupBy({
                    by: ['enrollmentId'],
                    where: { enrollmentId: { in: ids }, status: 'COMPLETED' },
                    _count: { _all: true }
                });
                grouped.forEach(g => { completedMap[String(g.enrollmentId)] = g._count._all || 0; });
            } catch (e) {
                // If groupBy isn't supported or fails, silently continue with zeros
                console.warn('[listPaidEnrollments] groupBy failed, skipping progress counts', e.message || e);
            }
        }

        const studentsWithProgress = students.map(s => {
            const completed = completedMap[String(s.id)] || 0;
            const lessonsPercent = totalLessons > 0 ? Math.min(100, Math.round((completed / totalLessons) * 100)) : 0;
            return Object.assign({}, s, { lessonsCompleted: completed, lessonsPercent });
        });

        return res.json(studentsWithProgress);
    } catch (err) {
        console.error('[listPaidEnrollments] Erro:', err);
        console.error(err.stack);
        // Em ambiente de desenvolvimento, devolver detalhes; em produção, manter mensagem genérica
        const isDev = process.env.NODE_ENV !== 'production';
        return res.status(500).json({ error: 'Erro ao buscar alunos pagos', details: isDev ? (err.message || String(err)) : undefined });
    }
};

// Resumo: total de inscritos e quantos estão PAID
export const enrollmentSummary = async (req, res) => {
    try {
        const paidCount = await prisma.enrollment.count({ where: { status: { in: ['PAID','ADMIN'] } } });
        const totalCount = await prisma.enrollment.count();
        const percent = totalCount ? Math.round((paidCount / totalCount) * 100) : 0;
        // Calculate average lessons completion percent for PAID students
        let averageLessonsPercent = 0;
        try {
            if (paidCount > 0) {
                const paidStudents = await prisma.enrollment.findMany({ where: { status: { in: ['PAID','ADMIN'] } }, select: { id: true } });
                const ids = paidStudents.map(s => s.id);

                // Determine totalLessons
                const totalLessons = await countVimeoIds();

                let completedMap = {};
                if (ids.length > 0) {
                    try {
                        const grouped = await prisma.lessonProgress.groupBy({
                            by: ['enrollmentId'],
                            where: { enrollmentId: { in: ids }, status: 'COMPLETED' },
                            _count: { _all: true }
                        });
                        grouped.forEach(g => { completedMap[String(g.enrollmentId)] = g._count._all || 0; });
                    } catch (e) {
                        console.warn('[enrollmentSummary] groupBy failed, skipping progress counts', e.message || e);
                    }
                }

                // Compute per-student percent and average
                const percents = ids.map(id => {
                    const completed = completedMap[String(id)] || 0;
                    return totalLessons > 0 ? Math.min(100, Math.round((completed / totalLessons) * 100)) : 0;
                });

                const sum = percents.reduce((a, b) => a + b, 0);
                averageLessonsPercent = percents.length ? Math.round(sum / percents.length) : 0;
            }
        } catch (e) {
            console.warn('[enrollmentSummary] erro ao calcular média de conclusão:', e.message || e);
            averageLessonsPercent = 0;
        }

        return res.json({ paidCount, totalCount, percent, averageLessonsPercent });
    } catch (err) {
        console.error('[enrollmentSummary] Erro:', err);
        return res.status(500).json({ error: 'Erro ao calcular resumo de inscrições', details: process.env.NODE_ENV !== 'production' ? String(err) : undefined });
    }
};

export const createEnrollmentByAdmin = async (req, res) => {
    try {
        // req.enrollment vem do middleware requireAuth
        if (req.enrollment.status !== 'ADMIN') {
             return res.status(403).json({ error: 'Apenas administradores podem realizar esta ação.' });
        }

        const { name, email, cpf, phone, modality } = req.body;

        if (!name || !email || !cpf) {
            return res.status(400).json({ error: 'Nome, Email e CPF são obrigatórios.' });
        }
        
        const cleanCpf = String(cpf).replace(/\D/g, '');

        const existing = await prisma.enrollment.findFirst({
            where: {
                OR: [
                    { email: email },
                    { cpf: cleanCpf }
                ]
            }
        });

        if (existing) {
            return res.status(400).json({ error: 'Já existe um aluno com este Email ou CPF.' });
        }

        const newStudent = await prisma.enrollment.create({
            data: {
                name,
                email,
                cpf: cleanCpf,
                phone: phone || '', // Phone cannot be null in schema
                modality: modality || 'Extensivo',
                amount: 0.0,
                status: 'PAID',
                birthDate: null,
            }
        });

        // Enviar emails: primeiro Boas-vindas, depois Credenciais
        // Não awaitamos para não bloquear o retorno da requisição, ou awaitamos se quisermos garantir envio?
        // Como é admin, melhor esperar para garantir que foi enviado.
        await sendWelcomeEmail(email, name);
        await sendCredentialsEmail(email, name, cleanCpf);

        return res.status(201).json({ success: true, student: newStudent });

    } catch (error) {
        console.error("[createEnrollmentByAdmin] Erro:", error);
        return res.status(500).json({ error: 'Erro interno ao criar aluno.' });
    }
};
export const updateStudentModality = async (req, res) => {
    try {
        console.log("[updateStudentModality] Iniciando atualização de modalidade...");
        if (!req.enrollment || req.enrollment.status !== 'ADMIN') {
            return res.status(403).json({ error: 'Apenas administradores podem realizar esta ação.' });
        }

        const { cpf, modality } = req.body;

        if (!cpf || !modality) {
            return res.status(400).json({ error: 'CPF e Nova Modalidade são obrigatórios.' });
        }

        const cleanCpf = String(cpf).replace(/\D/g, '');

        const student = await prisma.enrollment.findUnique({
            where: { cpf: cleanCpf }
        });

        if (!student) {
            return res.status(404).json({ error: 'Aluno não encontrado com este CPF.' });
        }

        const updatedStudent = await prisma.enrollment.update({
            where: { cpf: cleanCpf },
            data: { modality }
        });

        console.log(`[updateStudentModality] Modalidade do aluno ${student.name} (${cleanCpf}) alterada para ${modality}.`);

        return res.json({ success: true, message: 'Modalidade atualizada com sucesso.', student: updatedStudent });

    } catch (error) {
        console.error('[updateStudentModality] Erro:', error);
        return res.status(500).json({ error: 'Erro ao atualizar modalidade.', details: error.message });
    }
};
