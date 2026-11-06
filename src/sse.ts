import type { Response } from "express";
import type { Order } from "./types.js";

export type EventName =
  | "order-created"
  | "order-status-changed"
  | "order-cancelled"
  | "stock-changed";

const clients = new Set<Response>();
const orderClients = new Map<Order["id"], Set<Response>>();

function openStream(res: Response): void {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();
}

export function subscribe(res: Response): void {
  openStream(res);
  clients.add(res);
  res.on("close", () => clients.delete(res));
}

export function subscribeToOrder(orderId: Order["id"], res: Response): void {
  openStream(res);
  const subscribers = orderClients.get(orderId) ?? new Set<Response>();
  subscribers.add(res);
  orderClients.set(orderId, subscribers);
  res.on("close", () => {
    subscribers.delete(res);
    if (subscribers.size === 0) orderClients.delete(orderId);
  });
}

let id = 0;
export function broadcast(event: EventName, data: unknown, orderId?: Order["id"]): void {
  const msg = `id: ${++id}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) res.write(msg);
  if (orderId === undefined) return;
  for (const res of orderClients.get(orderId) ?? []) res.write(msg);
}
