import express from "express";
import cors from "cors";

const DEFAULT_PORT = 3000;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const PORT = Number(process.env.PORT) || DEFAULT_PORT;
export const server = app.listen(PORT, () =>
  console.log(`http://localhost:${PORT}`),
);
