import { Request, Response, Router } from "express";

const logRouter = Router();
logRouter.all("/auth", logAuth);
export default logRouter;

function logAuth(req: Request, res: Response) {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  console.log("Bearer token: ", token);
  console.log("User: ", req.user);
  res.json({});
}
