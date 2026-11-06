import type { Response } from "express";
import { HTTP_NO_CONTENT } from "./errors.js";
import type { Order } from "./types.js";

export type EventName =
  | "order-created"
  | "order-status-changed"
  | "order-cancelled"
  | "stock-changed";

type SentEvent = { id: number; msg: string };

const RETRY_MS = 5000;
const HEARTBEAT_MS = 15_000;

const clients = new Set<Response>();
const orderClients = new Map<Order["id"], Set<Response>>();
const orderHistory = new Map<Order["id"], SentEvent[]>();

function openStream(res: Response): void {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();
  res.write(`retry: ${RETRY_MS}\n\n`);
  const heartbeat = setInterval(() => res.write(": ping\n\n"), HEARTBEAT_MS);
  res.on("close", () => clearInterval(heartbeat));
}

export function subscribe(res: Response): void {
  openStream(res);
  clients.add(res);
  res.on("close", () => clients.delete(res));
}

export function subscribeToOrder(
  orderId: Order["id"],
  res: Response,
  lastEventId: number,
  finished: boolean,
): void {
  const missed = (orderHistory.get(orderId) ?? []).filter((event) => event.id > lastEventId);
  if (finished && missed.length === 0) {
    res.status(HTTP_NO_CONTENT).end();
    return;
  }

  openStream(res);
  for (const event of missed) res.write(event.msg);
  if (finished) {
    res.end();
    return;
  }

  const subscribers = orderClients.get(orderId) ?? new Set<Response>();
  subscribers.add(res);
  orderClients.set(orderId, subscribers);
  res.on("close", () => {
    subscribers.delete(res);
    if (subscribers.size === 0) orderClients.delete(orderId);
  });
}

export function endOrderStream(orderId: Order["id"]): void {
  for (const res of orderClients.get(orderId) ?? []) res.end();
  orderClients.delete(orderId);
}

let id = 0;
export function broadcast(event: EventName, data: unknown, orderId?: Order["id"]): void {
  const msg = `id: ${++id}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) res.write(msg);
  if (orderId === undefined) return;

  const history = orderHistory.get(orderId) ?? [];
  history.push({ id, msg });
  orderHistory.set(orderId, history);
  for (const res of orderClients.get(orderId) ?? []) res.write(msg);
}
