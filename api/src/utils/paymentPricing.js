export const COURSE_PRICES = Object.freeze({
    COM_MATERIAL: 999.90,
    SEM_MATERIAL: 559.90
});

export function normalizeCouponCode(code) {
    return String(code || '')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/\s+/g, '')
        .replace(/[^A-Za-z0-9]/g, '')
        .toUpperCase();
}

export function getBasePrice(modality) {
    const price = COURSE_PRICES[modality];
    if (price === undefined) {
        throw new RangeError('Modalidade inválida.');
    }
    return price;
}

export function applyCoupon(basePrice, coupon) {
    const discount = Number(coupon.discount);
    if (!Number.isFinite(discount) || discount <= 0) {
        throw new RangeError('Desconto de cupom inválido.');
    }

    let finalPrice;
    if (coupon.type === 'FIXED_PRICE') {
        if (discount > basePrice) {
            throw new RangeError('O preço fixo do cupom não pode exceder o preço do plano.');
        }
        finalPrice = discount;
    } else if (coupon.type === 'PERCENTAGE') {
        if (discount > 100) {
            throw new RangeError('O percentual do cupom deve ser de até 100%.');
        }
        finalPrice = basePrice * (1 - discount / 100);
    } else {
        throw new RangeError('Tipo de cupom inválido.');
    }

    return Number(finalPrice.toFixed(2));
}
