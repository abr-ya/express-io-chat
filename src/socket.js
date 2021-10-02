import { nanoid } from "nanoid";
import logger from "./utils/logger.js";
import EVENTS from "./socketEvents.js";

// отдавать данные из бд по сокетам - пока не используем
import user from "./routes/user.js";
import game from "./routes/game.js";
import task from "./routes/task.js";

// "серверные" данные
const rooms = {};
const tasks = {};

const socket = ({ io }) => {
  logger.info(`Sockets enabled`);

  io.on(EVENTS.connection, (socket) => {
    logger.info(`User ${socket.id} connected to server`);

    socket.emit(EVENTS.SERVER.ROOMS, rooms);

    /*
     * When a user creates a new room
     */
    socket.on(EVENTS.CLIENT.CREATE_ROOM, (roomName) => {
      console.log('создаём комнату', roomName);
      if (!roomName) {
        console.log("не передано имя комнаты!");
        return false;
      }
      const roomId = roomName;
      if (Object.values(rooms).some((room) => room.name === roomName)) {
        console.log("такая комната уже есть!");
        // return false;
      } else {
        // create a roomId
        // const roomId = nanoid(); name === id
        // add a new room to the rooms object
        rooms[roomId] = {
          name: roomName,
          id: roomId,
        };
        tasks[roomId] = [];
      }

      socket.join(roomId);
      const clients = io.sockets.adapter.rooms.get(roomId);
      console.log('пользователи комнаты', roomId, clients);

      // broadcast an event saying there is a new room
      socket.broadcast.emit(EVENTS.SERVER.ROOMS, rooms);

      // emit back to the room creator with all the rooms
      socket.emit(EVENTS.SERVER.ROOMS, rooms);
      // emit event back the room creator saying they have joined a room
      socket.emit(EVENTS.SERVER.JOINED_ROOM, roomId);
    });

    /*
     * When a user creates a new task
     */
    socket.on(EVENTS.CLIENT.CREATE_TASK, ({ roomId, title, link, priority }) => {
      console.log('создаём в комнате', roomId, 'таску', title, link, priority);
      //const roomID = Object.values(rooms).find((room) => room.name === roomName);
      //const newTask = task.taskToBase({title, link, priority});
      tasks[roomId].push({id: nanoid(6), title, link, priority});

      // broadcast an event saying there is a new room
      //socket.broadcast.emit(EVENTS.SERVER.ROOMS, rooms);

      // emit back to the creator with all room's tasks
      socket.emit(EVENTS.SERVER.TASKS, tasks[roomId]);
      // emit event back the room creator saying they have joined a room
      //socket.emit(EVENTS.SERVER.JOINED_ROOM, roomId);
    });

    /*
     * When a user sends a room message
     */
    socket.on(
      EVENTS.CLIENT.SEND_ROOM_MESSAGE,
      ({ roomId, message, username }) => {
        // logger.info(`new mes: roomId - ${roomId}, text - ${message} - ${username}`);
        const date = new Date();

        socket.to(roomId).emit(EVENTS.SERVER.ROOM_MESSAGE, {
          message,
          username,
          time: `${date.getHours()}:${date.getMinutes()}`,
        });
      }
    );

    /*
     * When a user joins a room
     */
    socket.on(EVENTS.CLIENT.JOIN_ROOM, (roomId) => {
      socket.join(roomId);
      const clients = io.sockets.adapter.rooms.get(roomId);
      logger.info('пользователи комнаты', roomId, clients);

      socket.emit(EVENTS.SERVER.JOINED_ROOM, roomId);
    });
  });
}

export default socket;
