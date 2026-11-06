import { Router } from "express";
import { HTTP_NOT_FOUND, HttpError } from "../errors.js";
import { findAllProducts, findProductById } from "../models/product.model.js";
import { checkValidId } from "../utils/parse-id.js";

export const productsRouter = Router();

productsRouter.get("/", async (_req, res) => {
  res.json(await findAllProducts());
});

productsRouter.get("/:id", async (req, res) => {
  const id = checkValidId(req.params.id);
  const product = await findProductById(id);
  if (!product) throw new HttpError(HTTP_NOT_FOUND, `Produit ${id} introuvable`);
  res.json(product);
});
