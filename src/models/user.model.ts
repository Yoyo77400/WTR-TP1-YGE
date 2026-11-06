import { Config, JsonDB } from "node-json-db";
import type { User } from "../types.js";

const USERS_PATH = "/users";

const SEED_USERS: User[] = [
  { id: 1, name: "Ada Lovelace", username: "ada", email: "ada@esgi.fr" },
  { id: 2, name: "Alan Turing", username: "alan", email: "alan@esgi.fr" },
];

const db = new JsonDB(new Config("data/users", true, true, "/"));

export async function seedUsers(): Promise<void> {
  if (!(await db.exists(USERS_PATH))) {
    await db.push(USERS_PATH, SEED_USERS);
  }
}

export async function findAllUsers(): Promise<User[]> {
  return db.getObject<User[]>(USERS_PATH);
}

export async function findUserById(id: User["id"]): Promise<User | undefined> {
  const users = await findAllUsers();
  return users.find((user) => user.id === id);
}
