import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from 'cors';

import logger from "./utils/logger.js";
import socket from "./socket.js";

import user from "./routes/user.js";
import game from "./routes/game.js";
import task from "./routes/task.js";

const config = {
  corsOrigin: "*",
  port: 4000,
  host: "localhost",
  version: "0.1",
};
const PORT = process.env.PORT || config.port;

const app = express();
const httpServer = createServer(app);


// настройки для REST
app.use(cors());
app.use(express.json());
app.use('/user', user.router);
app.use('/game', game.router);
app.use('/task', task.router);


// SWAGGER START //
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Express API for Poker',
    version: '1.0.0',
    description: 'This is a REST API application made with Express.',
  },
};

const swOptions = {
  swaggerDefinition,
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(swOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// SWAGGER END //


const io = new Server(httpServer, {
  cors: {
    origin: config.corsOrigin,
    credentials: true,
  },
});

app.get("/", (_, res) =>
  res.send(`Server is up and running version ${config.version}`)
);

httpServer.listen(PORT, () => {
  logger.info(`🚀 Server version ${config.version} is listening 🚀`);
  logger.info(`port: ${PORT}`);

  socket({ io });
});
