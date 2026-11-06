import express from "express";
import cors from "cors";
import { seedProducts } from "./models/product.model.js";
import { seedUsers } from "./models/user.model.js";

const DEFAULT_PORT = 3000;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

await seedUsers();
await seedProducts();

const PORT = Number(process.env.PORT) || DEFAULT_PORT;
export const server = app.listen(PORT, () =>
  console.log(`http://localhost:${PORT}`),
);
