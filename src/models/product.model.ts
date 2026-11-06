import { Config, JsonDB } from "node-json-db";
import type { Product } from "../types.js";

const PRODUCTS_PATH = "/products";

const SEED_PRODUCTS: Product[] = [
  { id: 1, name: "Clavier mécanique", stock: 5 },
  { id: 2, name: "Souris sans fil", stock: 3 },
  { id: 3, name: "Écran 27 pouces", stock: 2 },
];

const db = new JsonDB(new Config("data/products", true, true, "/"));

export async function seedProducts(): Promise<void> {
  if (!(await db.exists(PRODUCTS_PATH))) {
    await db.push(PRODUCTS_PATH, SEED_PRODUCTS);
  }
}

export async function findAllProducts(): Promise<Product[]> {
  return db.getObject<Product[]>(PRODUCTS_PATH);
}

export async function findProductById(
  id: Product["id"],
): Promise<Product | undefined> {
  const products = await findAllProducts();
  return products.find((product) => product.id === id);
}

export async function updateProductStock(
  id: Product["id"],
  stock: Product["stock"],
): Promise<Product | undefined> {
  const index = await db.getIndex(PRODUCTS_PATH, id);
  if (index === -1) return undefined;
  await db.push(`${PRODUCTS_PATH}[${index}]/stock`, stock);
  return db.getObject<Product>(`${PRODUCTS_PATH}[${index}]`);
}
