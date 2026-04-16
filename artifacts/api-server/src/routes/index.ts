import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bookingsRouter from "./bookings";
import adminRouter from "./admin";
import payRouter from "./pay";
import testTelegramRouter from "./test-telegram";

const router: IRouter = Router();

router.use(healthRouter);
router.use(bookingsRouter);
router.use(adminRouter);
router.use(payRouter);
router.use(testTelegramRouter);

export default router;
