import { Router } from "express";
import { HTTP_CREATED } from "../errors.js";
import {
  changeOrderStatus,
  createOrder,
  getOrder,
  isFinished,
  listOrders,
} from "../services/order.service.js";
import { subscribeToOrder } from "../sse.js";
import { checkValidId } from "../utils/parse-id.js";

export const ordersRouter = Router();

ordersRouter.get("/", async (_req, res) => {
  res.json(await listOrders());
});

ordersRouter.get("/:id", async (req, res) => {
  res.json(await getOrder(checkValidId(req.params.id)));
});

ordersRouter.get("/:id/events", async (req, res) => {
  const order = await getOrder(checkValidId(req.params.id));
  const lastEventId = Number(req.get("Last-Event-ID") ?? 0);
  subscribeToOrder(order.id, res, lastEventId, isFinished(order));
});

ordersRouter.post("/", async (req, res) => {
  const body: unknown = req.body;
  res.status(HTTP_CREATED).json(await createOrder(body));
});

ordersRouter.patch("/:id/status", async (req, res) => {
  const body: unknown = req.body;
  const status = typeof body === "object" && body !== null
    ? (body as Record<string, unknown>).status
    : undefined;
  res.json(await changeOrderStatus(checkValidId(req.params.id), status));
});
