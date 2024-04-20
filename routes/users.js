const express = require('express')
const router = new express.Router()

const ExpressError = require('../expressError')
const User = require('../models/user')
const Message = require('../models/message')

const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth')


/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/
router.get('/', ensureLoggedIn, async (req, res, next) => {
    try {
        const allUsers = await User.all()

        return res.json({ users: allUsers })
    } catch (e) {
        return next(e)
    }

})


/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/
router.get('/:username', ensureLoggedIn, ensureCorrectUser, async (req, res, next) => {
    try {
        const { username } = req.params

        const user = await User.get(username)

        return res.json({ user: user })
    } catch (e) {
        return next(e)
    }
})


/** GET /:username/to - get messages to user. Messages that I got from another user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/to', ensureLoggedIn, ensureCorrectUser, async (req, res, next) => {
    try {
        const messages = await User.messagesTo(req.params.username)

        return res.json({ messages: messages })

    } catch (e) {
        return next(e)
    }
})


/** GET /:username/from - get messages from user. Messages that I sent to another user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/from', ensureLoggedIn, ensureCorrectUser, async (req, res, next) => {
    try {
        const { username } = req.params

        const messages = await User.messagesFrom(username)

        return res.json({ messages: messages })

    } catch (e) {
        return next(e)
    }
})


module.exports = router