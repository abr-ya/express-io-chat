import { nanoid } from "nanoid";
import logger from "./utils/logger.js";

const EVENTS = {
  connection: "connection",
  CLIENT: {
    CREATE_ROOM: "CREATE_ROOM",
    SEND_ROOM_MESSAGE: "SEND_ROOM_MESSAGE",
    JOIN_ROOM: "JOIN_ROOM",
  },
  SERVER: {
    ROOMS: "ROOMS",
    JOINED_ROOM: "JOINED_ROOM",
    ROOM_MESSAGE: "ROOM_MESSAGE",
  },
};

const rooms = {};

function socket({ io }) {
  logger.info(`Sockets enabled`);

  io.on(EVENTS.connection, (socket) => {
    logger.info(`User connected ${socket.id}`);

    socket.emit(EVENTS.SERVER.ROOMS, rooms);

    /*
     * When a user creates a new room
     */
    socket.on(EVENTS.CLIENT.CREATE_ROOM, ({ roomName }) => {
      console.log({ roomName });
      if (!roomName) {
        console.log("не передано имя комнаты!");
        return false;
      }
      if (Object.values(rooms).some((room) => room.name === roomName)) {
        console.log("такая комната уже есть!");
        return false;
      }
      // create a roomId
      const roomId = nanoid();
      // add a new room to the rooms object
      rooms[roomId] = {
        name: roomName,
        id: roomId,
      };

      socket.join(roomId);

      // broadcast an event saying there is a new room
      socket.broadcast.emit(EVENTS.SERVER.ROOMS, rooms);

      // emit back to the room creator with all the rooms
      socket.emit(EVENTS.SERVER.ROOMS, rooms);
      // emit event back the room creator saying they have joined a room
      socket.emit(EVENTS.SERVER.JOINED_ROOM, roomId);
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

      socket.emit(EVENTS.SERVER.JOINED_ROOM, roomId);
    });
  });
}

export default socket;
