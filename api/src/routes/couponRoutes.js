import express from "express";
import { getCoupons, createCoupon, deleteCoupon, validateCoupon } from "../controllers/couponController.js";

const router = express.Router();

router.get("/validate/:code", validateCoupon);
router.get("/", getCoupons);
router.post("/", createCoupon);
router.delete("/:id", deleteCoupon);

export default router;