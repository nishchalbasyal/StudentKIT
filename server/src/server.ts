import app from "./app.js";
import { env } from "./config/env.js";
import { disconnectPrisma } from "./database/prisma.js";
import { findAvailablePort } from "./utils/findPort.js";

async function startServer() {
  try {
    const port = await findAvailablePort(env.PORT);

    const server = app.listen(port, () => {
      console.log(`Student Kit API listening on port ${port}`);
      console.log(`Access at: http://localhost:${port}/api`);
    });

    async function shutdown(signal: string) {
      console.log(`${signal} received, shutting down`);
      server.close(async () => {
        await disconnectPrisma();
        process.exit(0);
      });
    }

    process.on("SIGINT", () => {
      void shutdown("SIGINT");
    });

    process.on("SIGTERM", () => {
      void shutdown("SIGTERM");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    await disconnectPrisma();
    process.exit(1);
  }
}

void startServer();
