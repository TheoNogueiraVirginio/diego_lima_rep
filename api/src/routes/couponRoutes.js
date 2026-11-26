import express from "express";
import { getCoupons, createCoupon, deleteCoupon, validateCoupon } from "../controllers/couponController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/validate/:code", validateCoupon);
router.get("/", requireAuth, requireAdmin, getCoupons);
router.post("/", requireAuth, requireAdmin, createCoupon);
router.delete("/:id", requireAuth, requireAdmin, deleteCoupon);

function requireAdmin(req, res, next) {
    if (req.enrollment?.status !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso restrito a administradores.' });
    }
    return next();
}

export default router;