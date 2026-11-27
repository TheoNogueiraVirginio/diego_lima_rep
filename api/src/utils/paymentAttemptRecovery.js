export class DuplicateProviderPaymentsError extends Error {
    constructor(externalReference) {
        super(`Multiple Mercado Pago payments found for attempt ${externalReference}.`);
        this.name = 'DuplicateProviderPaymentsError';
        this.code = 'DUPLICATE_PROVIDER_PAYMENTS';
    }
}

export class PaymentAttemptNotFoundError extends Error {
    constructor(externalReference) {
        super(`No Mercado Pago payment found for unresolved attempt ${externalReference}.`);
        this.name = 'PaymentAttemptNotFoundError';
        this.code = 'PAYMENT_ATTEMPT_NOT_FOUND';
    }
}

export async function recoverPaymentAttempt(paymentClient, attempt) {
    if (attempt.paymentId) {
        return paymentClient.get({ id: attempt.paymentId });
    }

    const searchResult = await paymentClient.search({
        options: { external_reference: attempt.externalReference }
    });
    const matchingPayments = (searchResult.results || []).filter((result) =>
        result.external_reference === attempt.externalReference
    );

    if (matchingPayments.length > 1) {
        throw new DuplicateProviderPaymentsError(attempt.externalReference);
    }
    if (matchingPayments.length === 1) {
        if (!matchingPayments[0].id) {
            throw new Error('Mercado Pago retornou uma cobrança sem identificador.');
        }
        return paymentClient.get({ id: String(matchingPayments[0].id) });
    }

    throw new PaymentAttemptNotFoundError(attempt.externalReference);
}
