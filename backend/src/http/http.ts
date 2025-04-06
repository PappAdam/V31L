import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import path from "path";
import YAML from "yamljs";
import authRouter from "@/http/auth";
import logRouter from "@/http/log";
import invRouter from "@/http/invitation";
import { extractUserFromTokenMiddleWare } from "@/http/middlewares/validate";
import chatRouter from "./chat";
import imgRouter from "./image";

const httpServer = express();
httpServer.use(cors());

const swaggerDocument = YAML.load(path.join(__dirname, "./_doc.yml"));
httpServer.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

httpServer.use(
  "/jest-html-reporters-attach",
  express.static(
    path.join(__dirname, "../../__tests__/report/jest-html-reporters-attach")
  )
);
httpServer.get("/tests", (req, res) => {
  res.sendFile(path.join(__dirname, "../../__tests__/report/index.html"));
});

httpServer.use(bodyParser.json());
httpServer.use("/auth", authRouter);

// You can use req.user after this middleware runs
const protectedRoutes = httpServer.use(extractUserFromTokenMiddleWare);

protectedRoutes.use("/log", logRouter);
protectedRoutes.use("/inv", invRouter);
protectedRoutes.use("/chat", chatRouter);
protectedRoutes.use("/img", imgRouter);

export default httpServer;
