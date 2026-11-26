const PENDING_PAYMENT_STATUSES = new Set([
    'pending',
    'in_process',
    'processing',
    'authorized',
    'pending_waiting_transfer'
]);

const TERMINAL_PAYMENT_STATUSES = new Set([
    'rejected',
    'cancelled',
    'refunded'
]);

function toCents(amount) {
    return Math.round(Number(amount) * 100);
}

export function hasExactPaymentTotal(paymentInfo, expectedAmount, requireCardTotal = false) {
    const totalPaid = paymentInfo.transaction_details?.total_paid_amount;
    if (totalPaid == null) {
        return !requireCardTotal || paymentInfo.payment_type_id !== 'credit_card';
    }

    return toCents(totalPaid) === toCents(expectedAmount);
}

export function isPendingPaymentStatus(status) {
    return PENDING_PAYMENT_STATUSES.has(status);
}

export function isTerminalPaymentStatus(status) {
    return TERMINAL_PAYMENT_STATUSES.has(status);
}

export function isSamePaymentIntent(paymentInfo, requested) {
    const expectedMethodId = requested.paymentMethod === 'cartao'
        ? requested.paymentMethodId
        : requested.paymentMethod;
    const paymentTypeMatches = requested.paymentMethod !== 'cartao' ||
        paymentInfo.payment_type_id === 'credit_card';

    return paymentInfo.metadata?.modality === requested.modality &&
        toCents(paymentInfo.transaction_amount) === toCents(requested.amount) &&
        paymentInfo.payment_method_id === expectedMethodId &&
        paymentTypeMatches &&
        (requested.paymentMethod !== 'cartao' ||
            (Number(paymentInfo.installments) === Number(requested.installments) &&
                String(paymentInfo.issuer_id) === String(requested.issuerId)));
}

export async function cancelPendingPayment(paymentClient, paymentId) {
    const cancelled = await paymentClient.cancel({ id: paymentId });
    if (cancelled.status !== 'cancelled') {
        throw new Error('Mercado Pago não confirmou o cancelamento do pagamento anterior.');
    }
}
