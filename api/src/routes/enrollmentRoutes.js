import express from "express";
import { createEnrollment, checkPaymentStatus, getExistingEnrollment, verifyLogin, listPaidEnrollments, enrollmentSummary, createEnrollmentByAdmin, updateStudentModality } from "../controllers/enrollmentController.js";
import { requireAuth } from '../middleware/authMiddleware.js';

import prisma from "../db.js";

const router = express.Router();

//CADASTRO
router.post("/register", createEnrollment);
router.post("/admin/create", requireAuth, createEnrollmentByAdmin);
router.put("/admin/modality", requireAuth, updateStudentModality);

router.get("/existing", getExistingEnrollment);
router.get("/paid", listPaidEnrollments);
router.get("/summary", enrollmentSummary);
router.get("/status/:id", checkPaymentStatus)


//LOGIN
router.post("/login", verifyLogin);


export default router; 