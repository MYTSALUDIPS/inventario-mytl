// test-ruta.js
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Ruta esperada del index.html:");
console.log(path.resolve(__dirname, "../public/index.html"));
