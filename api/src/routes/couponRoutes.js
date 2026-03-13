import express from "express";
import { getCoupons, createCoupon, deleteCoupon } from "../controllers/couponController.js";

const router = express.Router();

router.get("/", getCoupons);
router.post("/", createCoupon);
router.delete("/:id", deleteCoupon);

export default router;