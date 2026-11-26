export function matchesInstallmentSelection(paymentInfo, requested) {
    return paymentInfo.payment_type_id === 'credit_card' &&
        Number(paymentInfo.installments) === Number(requested.installments) &&
        String(paymentInfo.payment_method_id) === String(requested.paymentMethodId) &&
        String(paymentInfo.issuer_id) === String(requested.issuerId);
}
