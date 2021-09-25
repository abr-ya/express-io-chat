import { Router } from "express";
import { nanoid } from "nanoid";
import lowDb from "lowdb";
import FileSync from "lowdb/adapters/FileSync.js";

const router = Router();
const db = lowDb(new FileSync('data/user.json'));

/**
 * @swagger
 * components:
 *   schemas:
 *     NewUser:
 *       type: object
 *       properties:
 *         first_name:
 *           type: string
 *           description: The user's name.
 *           example: Leanne
 *         last_name:
 *           type: string
 *           description: The user's surname.
 *           example: Graham
 *         position:
 *           type: string
 *           description: The user's position.
 *           example: Junior QA 
 *         image:
 *           type: string
 *           description: The user's image filename.
 *           example: image303.jpg
 *         is_observer:
 *           type: boolean
 *           description: ToDo.
 *           example: true
 *         is_master:
 *           type: boolean
 *           description: ToDo.
 *           example: true
 *         game:
 *           type: string
 *           description: ToDo.
 *           example: TVasX8
 * 
 *     User:
 *       allOf:
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *               description: The user ID.
 *               example: DVasX8
 *         - $ref: '#/components/schemas/NewUser'
 */

/**
 * @swagger
 * /user/:
 *   get:
 *     summary: Get all users.
 *     description: Get all users.
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', (req, res) => {
  const data = db.get("user").value()
  return res.status(200).json(data)
});

router.get('/:game', (req, res) => {
  const data = db.get("user").value();
  return res.status(200).json(data.filter(el => el.game == req.params.game))
});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewUser'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
*/
router.post('/', (req, res) => {
  const newUser = { id: nanoid(6), ...req.body }
  db.get("user").push(newUser).write();
  res.status(201).json({ newUser });
});

export default {router, db};
