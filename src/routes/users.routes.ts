import { Router } from "express";
import { HTTP_NOT_FOUND, HttpError } from "../errors.js";
import { findAllUsers, findUserById } from "../models/user.model.js";
import { checkValidId } from "../utils/parse-id.js";

export const usersRouter = Router();

usersRouter.get("/", async (_req, res) => {
  res.json(await findAllUsers());
});

usersRouter.get("/:id", async (req, res) => {
  const id = checkValidId(req.params.id);
  const user = await findUserById(id);
  if (!user) throw new HttpError(HTTP_NOT_FOUND, `Client ${id} introuvable`);
  res.json(user);
});
