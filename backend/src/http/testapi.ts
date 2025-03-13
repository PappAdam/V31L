import { loadData } from "@/db/_dbTestData/loadTestData";
import { Request, Response, Router } from "express";

const testApiRouter = Router();
testApiRouter.all("/seed", seedDatabase);
export default testApiRouter;

async function seedDatabase(req: Request, res: Response) {
  await loadData();
  res.json();
}
