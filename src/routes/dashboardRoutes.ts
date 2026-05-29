import { Router } from "express";
import { authMiddleware } from "../middleware/authmiddleware";
import { getDashboardStats, getknowledgeBase } from "../controller/dashboardController";


const router = Router();

router.use(authMiddleware);

router.get('/dashboardStats', getDashboardStats);
router.get('/knowledgeBase', getknowledgeBase);

export default router;