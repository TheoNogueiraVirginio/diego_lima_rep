import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getCoupons = async (req, res) => {
    try {
        const coupons = await prisma.coupon.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(coupons);
    } catch (error) {
        console.error("Erro ao buscar cupons:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

export const createCoupon = async (req, res) => {
    try {
        const { code, discount, type } = req.body;
        
        if (!code || discount === undefined) {
            return res.status(400).json({ error: "Código e desconto são obrigatórios." });
        }

        const upperCode = code.toUpperCase();
        const couponType = type === 'FIXED_PRICE' ? 'FIXED_PRICE' : 'PERCENTAGE';

        const existingCoupon = await prisma.coupon.findUnique({
            where: { code: upperCode }
        });

        if (existingCoupon) {
            return res.status(400).json({ error: "Esse código de cupom já existe." });
        }

        const newCoupon = await prisma.coupon.create({
            data: {
                code: upperCode,
                discount: parseFloat(discount),
                type: couponType
            }
        });

        res.status(201).json({ message: "Cupom criado com sucesso!", coupon: newCoupon });
    } catch (error) {
        console.error("Erro ao criar cupom:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

export const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        
        await prisma.coupon.delete({
            where: { id }
        });

        res.status(200).json({ message: "Cupom apagado com sucesso." });
    } catch (error) {
        console.error("Erro ao apagar cupom:", error);
        res.status(500).json({ error: "Erro ao apagar cupom." });
    }
};

export const validateCoupon = async (req, res) => {
    try {
        const { code } = req.params;
        const upperCode = code.toUpperCase();

        const coupon = await prisma.coupon.findUnique({
            where: { code: upperCode }
        });

        if (!coupon) {
            return res.status(404).json({ valid: false, error: "Cupom não encontrado." });
        }

        res.status(200).json({ valid: true, coupon });
    } catch (error) {
        console.error("Erro ao validar cupom:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};