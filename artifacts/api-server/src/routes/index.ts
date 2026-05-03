import { Router, type IRouter } from "express";
import healthRouter from "./health";
import carsRouter from "./cars";
import leadsRouter from "./leads";
import dashboardRouter from "./dashboard";
import whatsappRouter from "./whatsapp";
import settingsRouter from "./settings";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(carsRouter);
router.use(leadsRouter);
router.use(dashboardRouter);
router.use(whatsappRouter);
router.use(settingsRouter);
router.use(adminRouter);

export default router;
