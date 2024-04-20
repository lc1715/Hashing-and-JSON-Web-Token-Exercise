const express = require('express')
const router = new express.Router()

const ExpressError = require('../expressError')
const User = require('../models/user')
const Message = require('../models/message')

const { ensureLoggedIn } = require('../middleware/auth')

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', ensureLoggedIn, async (req, res, next) => {
    try {
        const { id } = req.params

        const messageDetails = await Message.get(id)

        const from_user = messageDetails.from_user.username
        const to_user = messageDetails.to_user.username

        if (from_user === req.user.username || to_user === req.user.username) {
            return res.json({ message: messageDetails })
        }

        throw new ExpressError('Access Denied. Cannot read this message', 401)
    } catch (e) {
        return next(e)
    }
})


/** POST / - post message. Create message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', ensureLoggedIn, async (req, res, next) => {
    try {
        const { from_username, to_username, body } = req.body

        const messageInfo = await Message.create({ from_username, to_username, body })

        return res.json({ message: messageInfo })
    } catch (e) {
        return next(e)
    }
})

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', ensureLoggedIn, async (req, res, next) => {
    try {
        const id = req.params.id

        const message = await Message.get(id)

        const username = message.to_user.username

        if (username === req.user.username) {
            const read = await Message.markRead(id)
            return res.json({ message: read })
        }

        throw new ExpressError('Action Denied. Cannot set this message to read', 400)
    } catch (e) {
        return next(e)
    }
})

module.exports = router