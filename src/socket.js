import { nanoid } from "nanoid";
import logger from "./utils/logger.js";
import EVENTS from "./socketEvents.js";

// отдавать данные из бд по сокетам - пока не используем
import user from "./routes/user.js";
import game from "./routes/game.js";
import task from "./routes/task.js";

// подготовка
const allUsers = user.db.get("user").value();
const allTasks = task.db.get("task").value();
const allGames = game.db.get("game").value();


// "серверные" данные, ключ - id комнаты
const rooms = {};
const tasks = {};

const afterJoin = (io, roomId) => {
  const clients = io.sockets.adapter.rooms.get(roomId);
  const users = Array.from(clients);
  console.log('пользователи комнаты', roomId, users);

  return users;
};

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
      console.log('tasks', tasks);

      socket.join(roomId);
      const users = afterJoin(io, roomId);
      socket.emit(EVENTS.SERVER.JOINED_ROOM, roomId);
      socket.broadcast.emit(EVENTS.SERVER.USERS, users);

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
    socket.on(EVENTS.CLIENT.CREATE_TASK, ({ roomId, issueText, link, priority }) => {
      console.log('создаём в комнате', roomId, 'таску', issueText, link, priority);
      //const roomID = Object.values(rooms).find((room) => room.name === roomName);
      //const newTask = task.taskToBase({title, link, priority});
      if (roomId && tasks[roomId] && Array.isArray(tasks[roomId])) {
        tasks[roomId].push({id: nanoid(6), issueText, link, priority});
      }

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
      const users = afterJoin(io, roomId);
      socket.emit(EVENTS.SERVER.JOINED_ROOM, roomId);
      socket.broadcast.emit(EVENTS.SERVER.USERS, users);
    });


    /*
     * STAGE EVENTS
     */
    socket.on(EVENTS.MASTER.TO_LOBBY, () => {
      const room = 'TVasX8';
      const users = allUsers.filter(el => el.game === room);
      // socket.emit(EVENTS.SERVER.JOINED_ROOM, roomId); // ответ
      socket.broadcast.emit(EVENTS.SERVER.TO_LOBBY, {users}); // остальным
    });

    socket.on(EVENTS.MASTER.TO_GAME, () => {
      const room = 'TVasX8';
      const users = allUsers.filter(el => el.game === room);
      // const tasks = allTasks.filter(el => el.game === room);
      const game = allGames.filter(el => el.id === room)[0];
      // socket.emit(EVENTS.SERVER.JOINED_ROOM, roomId); // ответ
      socket.broadcast.emit(EVENTS.SERVER.TO_GAME, {
        game, 
        users,
        tasks: tasks[room],
      }); // остальным
    });

    socket.on(EVENTS.MASTER.TO_RESULT, () => {
      // socket.emit(EVENTS.SERVER.JOINED_ROOM, roomId); // ответ
      socket.broadcast.emit(EVENTS.SERVER.TO_RESULT, {}); // остальным
    });
  });
}

export default socket;
