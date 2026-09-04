import { Router } from "express";
import multer from "multer";
import { requireRole } from "../auth/auth.middleware";
import * as usersController from "./users.controller";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export const usersRouter = Router();

usersRouter.use(requireRole("admin"));
usersRouter.get("/", usersController.list);
usersRouter.get("/:id", usersController.getOne);
usersRouter.post("/", usersController.create);
usersRouter.patch("/:id", usersController.update);
usersRouter.post("/:id/avatar", upload.single("avatar"), usersController.uploadAvatar);
usersRouter.delete("/:id", usersController.remove);
