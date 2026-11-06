import { Config, JsonDB } from "node-json-db";
import type { Order, Status } from "../types.js";

const ORDERS_PATH = "/orders";
const INITIAL_STATUS: Status = "preparing";

const db = new JsonDB(new Config("data/orders", true, true, "/"));

export type NewOrder = Pick<Order, "userId" | "productId" | "quantity">;

export async function seedOrders(): Promise<void> {
  if (!(await db.exists(ORDERS_PATH))) {
    await db.push(ORDERS_PATH, []);
  }
}

export async function findAllOrders(): Promise<Order[]> {
  return db.getObject<Order[]>(ORDERS_PATH);
}

export async function findOrderById(id: Order["id"]): Promise<Order | undefined> {
  const orders = await findAllOrders();
  return orders.find((order) => order.id === id);
}

export async function createOrder(input: NewOrder): Promise<Order> {
  const orders = await findAllOrders();
  const nextId = orders.reduce((max, order) => Math.max(max, order.id), 0) + 1;
  const order: Order = {
    id: nextId,
    ...input,
    status: INITIAL_STATUS,
    createdAt: new Date().toISOString(),
  };
  await db.push(`${ORDERS_PATH}[]`, order);
  return order;
}

export async function updateOrderStatus(
  id: Order["id"],
  status: Status,
): Promise<Order | undefined> {
  const index = await db.getIndex(ORDERS_PATH, id);
  if (index === -1) return undefined;
  await db.push(`${ORDERS_PATH}[${index}]/status`, status);
  return db.getObject<Order>(`${ORDERS_PATH}[${index}]`);
}
