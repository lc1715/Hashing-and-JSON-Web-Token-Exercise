/** User class for message.ly */
const db = require('../db')
const ExpressError = require('../expressError')
const { BCRYPT_WORK_FACTOR } = require('../config')
const bcrypt = require('bcrypt')


/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)

    const result = await db.query(`
    INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
    VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
    RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone])

    return result.rows[0]
  }


  /** For LogIn = Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {

    const result = await db.query(`
    SELECT password
    FROM users
    WHERE username = $1`,
      [username])

    let hashedPasswordObj = result.rows[0]

    if (result.rows.length === 0) {
      return false
    }

    let trueOrFalse = await bcrypt.compare(password, hashedPasswordObj.password)

    return trueOrFalse
  }


  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    await db.query(`
    UPDATE users
    SET last_login_at = current_timestamp
    WHERE username = $1
    RETURNING username, last_login_at`,
      [username])

    if (!result.rows[0]) {
      throw new ExpressError(`No such user: ${username}`, 404)
    }
  }


  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {

    const result = await db.query(`
    SELECT username, first_name, last_name, phone
    FROM users
    ORDER BY username`)

    return result.rows
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(`
    SELECT username, first_name, last_name, phone, join_at, last_login_at
    FROM users
    WHERE username = $1`,
      [username])

    if (result.rows.length === 0) {
      throw new ExpressError('Username is incorrect', 401)
    }

    return result.rows[0]
  }

  /** Return messages from this user. Get messages from user.
   *
   * [{id, to_username, body, sent_at, read_at}]
   *
   * where to_username is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = await db.query(`
    SELECT to_username
    FROM messages
    WHERE from_username = $1`,
      [username])

    const to_username = result.rows[0].to_username

    const to_user = await db.query(`
    SELECT username, first_name, last_name, phone
    FROM users
    WHERE username =$1`,
      [to_username])

    const messages = await db.query(`
      SELECT id, body, sent_at, read_at
      FROM messages
      WHERE from_username = $1`,
      [username])

    let messagesSentToOtherUsersInfo = to_user.rows[0]

    let usersMessages = messages.rows[0]

    usersMessages.to_user = messagesSentToOtherUsersInfo

    return messages.rows
  }


  /** Return messages to this user. Get messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const from_user = await db.query(`
    SELECT from_username
    FROM messages
    WHERE to_username = $1`,
      [username])

    const from_username = from_user.rows[0].from_username

    let fromUsernamesInfo = await db.query(`
    SELECT username, first_name, last_name, phone
    FROM users
    WHERE username = $1`,
      [from_username])

    const from_usersInfo = fromUsernamesInfo.rows[0]

    let message = await db.query(`
    SELECT id, body, sent_at, read_at
    FROM messages
    WHERE to_username = $1`,
      [username])

    const addFromUserToMessage = message.rows[0]
    addFromUserToMessage.from_user = from_usersInfo

    return message.rows
  }
}


module.exports = User;