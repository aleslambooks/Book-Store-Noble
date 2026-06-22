import { Router, type IRouter } from "express";
import healthRouter from "./health";
import booksRouter from "./books";
import categoriesRouter from "./categories";
import ordersRouter from "./orders";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(booksRouter);
router.use(categoriesRouter);
router.use(ordersRouter);
router.use(statsRouter);

export default router;
