import { Router, type IRouter } from "express";
import healthRouter from "./health";
import carsRouter from "./cars";
import leadsRouter from "./leads";
import dashboardRouter from "./dashboard";
import settingsRouter from "./settings";
import adminRouter from "./admin";
import staffAuthRouter from "./staff-auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(staffAuthRouter);
router.use(carsRouter);
router.use(leadsRouter);
router.use(dashboardRouter);
router.use(settingsRouter);
router.use(adminRouter);

export default router;
