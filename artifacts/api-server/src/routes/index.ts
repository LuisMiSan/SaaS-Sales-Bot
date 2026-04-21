import { Router, type IRouter } from "express";
import healthRouter from "./health";
import carsRouter from "./cars";
import leadsRouter from "./leads";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(carsRouter);
router.use(leadsRouter);
router.use(dashboardRouter);

export default router;
