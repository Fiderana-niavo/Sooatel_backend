import { Router } from "express";
import { leaveController } from "../controllers/leave.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

const leaveRouter = Router();

leaveRouter.use(authMiddleware);

leaveRouter.get("/upcoming", leaveController.getUpcomingLeaves);
leaveRouter.post("/", leaveController.createLeave);
leaveRouter.delete("/:id", leaveController.deleteLeave);
leaveRouter.post("/allocate-monthly", leaveController.allocateMonthly);
leaveRouter.post("/confirm/:idEmployee", leaveController.confirmJob);
leaveRouter.post("/salary-deduction", leaveController.salaryDeduction);
leaveRouter.get("/types", leaveController.getLeaveTypes);
leaveRouter.post("/types", leaveController.createLeaveType);
leaveRouter.put("/types/:id", leaveController.updateLeaveType);
leaveRouter.delete("/types/:id", leaveController.deleteLeaveType);
leaveRouter.get("/balances/:idEmployee", leaveController.getBalances);
leaveRouter.get("/balance/:idEmployee/:idLeaveType", leaveController.getBalance);
leaveRouter.get("/transactions/:idEmployee", leaveController.getTransactions);
leaveRouter.post("/resolve-overflow", leaveController.resolveOverflow);

export default leaveRouter;
