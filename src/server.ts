import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import { HTTP_BAD_REQUEST, HTTP_INTERNAL_ERROR, HttpError } from "./errors.js";
import { seedOrders } from "./models/order.model.js";
import { seedProducts } from "./models/product.model.js";
import { seedUsers } from "./models/user.model.js";
import { ordersRouter } from "./routes/orders.routes.js";
import { productsRouter } from "./routes/products.routes.js";
import { usersRouter } from "./routes/users.routes.js";
import { resumeDeliveries } from "./services/order.service.js";
import { subscribe } from "./sse.js";

const DEFAULT_PORT = 3000;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/events", (_req, res) => {
  subscribe(res);
});

app.use("/users", usersRouter);
app.use("/products", productsRouter);
app.use("/orders", ordersRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  //nous permet de catch les err de retour bad request si syntax de requete invalide
  if (err instanceof SyntaxError) {
    res.status(HTTP_BAD_REQUEST).json({ error: "JSON invalide" });
    return;
  }
  console.error(err);
  res.status(HTTP_INTERNAL_ERROR).json({ error: "Erreur interne du serveur" });
});

await seedUsers();
await seedProducts();
await seedOrders();
await resumeDeliveries();

const PORT = Number(process.env.PORT) || DEFAULT_PORT;
export const server = app.listen(PORT, () =>
  console.log(`http://localhost:${PORT}`),
);
