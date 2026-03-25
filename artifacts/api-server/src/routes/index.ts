import { Router, type IRouter } from "express";
import healthRouter from "./health";
import shardeumRouter from "./shardeum";

const router: IRouter = Router();

router.use(healthRouter);
router.use(shardeumRouter);

export default router;
