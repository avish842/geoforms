import dotenv from "dotenv";
import dns from "node:dns/promises";
import app from "./app.js";
import connectDB from "./db/index.js";

// 1️⃣ Load environment variables FIRST
dotenv.config({
  path: "./.env",
});

// 2️⃣ Force DNS resolver (SRV fix)
dns.setServers(["1.1.1.1", "8.8.8.8"]);

// 3️⃣ Start server ONLY after DB connects
const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error starting the server:", error);
    process.exit(1);
  });
