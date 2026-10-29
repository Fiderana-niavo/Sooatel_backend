import { Router } from "express";
import { leaveController } from "../controllers/leave.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const leaveRouter = Router();

leaveRouter.use(authMiddleware);

leaveRouter.get("/upcoming", authorize("hr.welfare"), leaveController.getUpcomingLeaves);
leaveRouter.post("/", authorize("hr.welfare"), leaveController.createLeave);
leaveRouter.delete("/:id", authorize("hr.welfare"), leaveController.deleteLeave);
leaveRouter.post("/allocate-monthly", authorize("hr.welfare"), leaveController.allocateMonthly);
leaveRouter.post("/confirm/:idEmployee", authorize("hr.welfare"), leaveController.confirmJob);
leaveRouter.post("/salary-deduction", authorize("hr.welfare"), leaveController.salaryDeduction);
leaveRouter.get("/types", authorize("hr.welfare"), leaveController.getLeaveTypes);
leaveRouter.post("/types", authorize("hr.welfare"), leaveController.createLeaveType);
leaveRouter.put("/types/:id", authorize("hr.welfare"), leaveController.updateLeaveType);
leaveRouter.delete("/types/:id", authorize("hr.welfare"), leaveController.deleteLeaveType);
leaveRouter.get("/balances/:idEmployee", authorize("hr.welfare"), leaveController.getBalances);
leaveRouter.get(
  "/balance/:idEmployee/:idLeaveType",
  authorize("hr.welfare"),
  leaveController.getBalance,
);
leaveRouter.get(
  "/transactions/:idEmployee",
  authorize("hr.welfare"),
  leaveController.getTransactions,
);
leaveRouter.post("/resolve-overflow", authorize("hr.welfare"), leaveController.resolveOverflow);

export default leaveRouter;
