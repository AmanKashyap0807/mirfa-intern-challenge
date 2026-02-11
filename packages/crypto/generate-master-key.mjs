import { randomBytes } from "crypto";

const masterKey = randomBytes(32).toString("hex");

console.log("Generated MASTER_KEY:", masterKey);
console.log("Set this in your .env file as: MASTER_KEY=" + masterKey);
