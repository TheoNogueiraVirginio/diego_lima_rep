import { createHash } from 'node:crypto';

const LOCK_TIMEOUT_SECONDS = 10;

export class PaymentLockUnavailableError extends Error {
    constructor() {
        super('Timed out waiting for an enrollment payment lock.');
        this.name = 'PaymentLockUnavailableError';
        this.code = 'PAYMENT_LOCK_UNAVAILABLE';
    }
}

export async function withEnrollmentPaymentLock(prisma, identifiers, callback) {
    const lockNames = [...new Set(identifiers.map((identifier) =>
        createHash('sha256').update(identifier).digest('hex')
    ))].sort();

    return prisma.$transaction(async (transaction) => {
        const acquiredLocks = [];
        try {
            for (const lockName of lockNames) {
                const result = await transaction.$queryRaw`
                    SELECT GET_LOCK(${lockName}, ${LOCK_TIMEOUT_SECONDS}) AS acquired
                `;
                if (Number(result?.[0]?.acquired) !== 1) {
                    throw new PaymentLockUnavailableError();
                }
                acquiredLocks.push(lockName);
            }

            return await callback(transaction);
        } finally {
            let releaseError;
            for (const lockName of acquiredLocks.reverse()) {
                try {
                    const result = await transaction.$queryRaw`
                        SELECT RELEASE_LOCK(${lockName}) AS released
                    `;
                    if (Number(result?.[0]?.released) !== 1) {
                        throw new Error('Failed to release an enrollment payment lock.');
                    }
                } catch (error) {
                    releaseError ??= error;
                }
            }
            if (releaseError) throw releaseError;
        }
    }, { maxWait: 15_000, timeout: 60_000 });
}
