import { Router } from "express";
import { authCallback, checkAdminEmail } from "../controller/auth.controller.js";

const router = Router();

router.post("/callback", authCallback);
router.post("/check-admin", checkAdminEmail);

export default router;
