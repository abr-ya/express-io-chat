import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import logger from "./utils/logger.js";
import socket from "./socket.js";

const config = {
  corsOrigin: "*",
  port: 4000,
  host: "localhost",
};

const PORT = process.env.PORT || config.port;
const corsOrigin = config.corsOrigin;
const version = "0.1";

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
});

app.get("/", (_, res) =>
  res.send(`Server is up and running version ${version}`)
);

httpServer.listen(PORT, () => {
  logger.info(`🚀 Server version ${version} is listening 🚀`);
  logger.info(`port: ${PORT}`);

  socket({ io });
});
