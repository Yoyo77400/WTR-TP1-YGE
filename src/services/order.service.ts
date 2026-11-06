import {
  HTTP_BAD_REQUEST,
  HTTP_CONFLICT,
  HTTP_NOT_FOUND,
  HttpError,
} from "../errors.js";
import * as orderModel from "../models/order.model.js";
import type { NewOrder } from "../models/order.model.js";
import { findProductById, updateProductStock } from "../models/product.model.js";
import { findUserById } from "../models/user.model.js";
import type { Order, Status } from "../types.js";

const STATUSES: readonly Status[] = ["preparing", "shipped", "delivered", "cancelled"];

const NEXT_STATUS: Partial<Record<Status, Status>> = {
  preparing: "shipped",
  shipped: "delivered",
};

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

function parseNewOrder(body: unknown): NewOrder {
  if (typeof body !== "object" || body === null) {
    throw new HttpError(HTTP_BAD_REQUEST, "Le corps de la requête doit être un objet JSON");
  }
  const { userId, productId, quantity } = body as Record<string, unknown>;
  if (!isPositiveInteger(userId)) {
    throw new HttpError(HTTP_BAD_REQUEST, "userId doit être un entier positif");
  }
  if (!isPositiveInteger(productId)) {
    throw new HttpError(HTTP_BAD_REQUEST, "productId doit être un entier positif");
  }
  if (!isPositiveInteger(quantity)) {
    throw new HttpError(HTTP_BAD_REQUEST, "quantity doit être un entier positif");
  }
  return { userId, productId, quantity };
}

export async function listOrders(): Promise<Order[]> {
  return orderModel.findAllOrders();
}

export async function getOrder(id: Order["id"]): Promise<Order> {
  const order = await orderModel.findOrderById(id);
  if (!order) throw new HttpError(HTTP_NOT_FOUND, `Commande ${id} introuvable`);
  return order;
}

export async function createOrder(body: unknown): Promise<Order> {
  const input = parseNewOrder(body);

  const user = await findUserById(input.userId);
  if (!user) throw new HttpError(HTTP_NOT_FOUND, `Client ${input.userId} introuvable`);

  const product = await findProductById(input.productId);
  if (!product) {
    throw new HttpError(HTTP_NOT_FOUND, `Produit ${input.productId} introuvable`);
  }
  if (product.stock < input.quantity) {
    throw new HttpError(
      HTTP_CONFLICT,
      `Stock insuffisant pour le produit ${product.id} : ${product.stock} restant(s)`,
    );
  }

  await updateProductStock(product.id, product.stock - input.quantity);
  return orderModel.createOrder(input);
}

export async function cancelOrder(id: Order["id"]): Promise<Order> {
  const order = await getOrder(id);
  if (order.status !== "preparing") {
    throw new HttpError(
      HTTP_CONFLICT,
      `La commande ${id} est au statut ${order.status} et ne peut plus être annulée`,
    );
  }

  const product = await findProductById(order.productId);
  if (product) await updateProductStock(product.id, product.stock + order.quantity);

  return setStatus(id, "cancelled");
}

export async function changeOrderStatus(id: Order["id"], status: unknown): Promise<Order> {
  if (!isStatus(status)) {
    throw new HttpError(
      HTTP_BAD_REQUEST,
      `status doit valoir l'une de ces valeurs : ${STATUSES.join(", ")}`,
    );
  }
  if (status === "cancelled") return cancelOrder(id);

  const order = await getOrder(id);
  if (NEXT_STATUS[order.status] !== status) {
    throw new HttpError(
      HTTP_CONFLICT,
      `La commande ${id} ne peut pas passer de ${order.status} à ${status}`,
    );
  }
  return setStatus(id, status);
}

async function setStatus(id: Order["id"], status: Status): Promise<Order> {
  const updated = await orderModel.updateOrderStatus(id, status);
  if (!updated) throw new HttpError(HTTP_NOT_FOUND, `Commande ${id} introuvable`);
  return updated;
}
