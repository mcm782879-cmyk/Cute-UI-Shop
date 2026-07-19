import { Router } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import servicesRouter from "./services";
import packagesRouter from "./packages";
import ordersRouter from "./orders";
import paymentsRouter from "./payments";
import galleryRouter from "./gallery";
import adminRouter from "./admin";

const router = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(servicesRouter);
router.use(packagesRouter);
router.use(ordersRouter);
router.use(paymentsRouter);
router.use(galleryRouter);
router.use(adminRouter);

export default router;
