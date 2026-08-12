import { Router } from "express";
import { requireRole } from "../auth/auth.middleware";
import * as usersController from "./users.controller";

export const usersRouter = Router();

usersRouter.use(requireRole("admin"));
usersRouter.get("/", usersController.list);
