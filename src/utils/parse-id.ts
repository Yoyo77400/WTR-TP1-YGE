import { HTTP_BAD_REQUEST, HttpError } from "../errors.js";

export function checkValidId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(HTTP_BAD_REQUEST, "L'identifiant doit être un entier positif");
  }
  return id;
}
