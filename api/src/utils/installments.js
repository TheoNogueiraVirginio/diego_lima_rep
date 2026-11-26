function toCents(amount) {
    return Math.round(Number(amount) * 100);
}

export function filterNoInterestInstallments(paymentMethods, amount, paymentMethodId) {
    if (!Array.isArray(paymentMethods)) {
        throw new TypeError('Resposta inválida ao consultar parcelas.');
    }

    const amountInCents = toCents(amount);
    const options = paymentMethods.flatMap((method) => {
        if (method.payment_method_id !== paymentMethodId || method.payment_type_id !== 'credit_card') {
            return [];
        }

        const issuerId = method.issuer?.id;
        if (!issuerId || !Array.isArray(method.payer_costs)) {
            return [];
        }

        return method.payer_costs
            .filter((cost) =>
                Number.isInteger(Number(cost.installments)) &&
                Number(cost.installments) >= 1 &&
                Number(cost.installments) <= 12 &&
                toCents(cost.total_amount) === amountInCents
            )
            .map((cost) => ({
                issuerId: String(issuerId),
                issuerName: method.issuer.name || '',
                installments: Number(cost.installments),
                installmentAmount: Number(cost.installment_amount),
                totalAmount: Number(cost.total_amount)
            }));
    });

    const uniqueOptions = new Map();
    for (const option of options) {
        uniqueOptions.set(`${option.issuerId}:${option.installments}`, option);
    }

    return [...uniqueOptions.values()].sort((a, b) =>
        a.installments - b.installments || a.issuerName.localeCompare(b.issuerName)
    );
}

export async function fetchNoInterestInstallments({
    accessToken,
    bin,
    amount,
    paymentMethodId,
    fetchImpl = globalThis.fetch
}) {
    const url = new URL('https://api.mercadopago.com/v1/payment_methods/installments');
    url.searchParams.set('bin', bin);
    url.searchParams.set('amount', Number(amount).toFixed(2));
    url.searchParams.set('payment_method_id', paymentMethodId);
    url.searchParams.set('payment_type_id', 'credit_card');

    const response = await fetchImpl(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) {
        throw new Error(`Mercado Pago não retornou opções de parcelas (HTTP ${response.status}).`);
    }

    const paymentMethods = await response.json();
    return filterNoInterestInstallments(paymentMethods, amount, paymentMethodId);
}
