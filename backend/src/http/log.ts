import { Request, Response, Router } from "express";

const logRouter = Router();
logRouter.all("/auth", logAuth);
export default logRouter;

function logAuth(req: Request, res: Response) {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  console.info("Bearer token: ", token);
  console.info("User: ", req.user);
  res.json();
}
