require('dotenv').config({path: 'src/.env'})
require('dotenv').config({})
const config = require('./config')
const Web3 = require('web3')
const web3 = new Web3(process.env.BSC_RPC)
const mongoose = require('mongoose')
const express = require('express')
const app = express()
const {usersSchema, swapSchema, paymentsSchema, debetPipeline, turnoversPipeline} = require("./mongoSchemas.js")

mongoose.connection.on('error', console.error.bind(console, 'failed to connect to data base'))
mongoose.connection.once('open', () => console.log('data base connected at ' + mongoose.connection._connectionString))

mongoose.connect(config.DB_URL, config.mongoDBConnectionOptions, err => {
    if (err) return console.error(err)
    mongoose.connections[0].createCollection('ref_royalty', {viewOn: 'users', pipeline: debetPipeline}).catch(err => console.error(err.message))

    app.use(express.static(__dirname + "/public"))
    app.use(require("cookie-parser")())
    app.use(require('cors')({
        credentials: true,
        origin: 'http://127.0.0.1:5501',
    }))
    app.use(require('express-session')({
        store:              require('mongoose-session')(mongoose),
        secret:             process.env.AUTH_SECRET_KEY,
        resave:             config.SESSION_RESAVE,
        saveUninitialized:  config.SESSION_SAVE_UNINITIALIZED,
        cookie: {
            secure: false,
            maxAge: 600e3,
            Path: '/'
        },
        maxAge:             config.SESSION_MAX_AGE
    }))

    app.get('/requestLogin', (req, res) => {
        if (!req.query.address) return res.sendStatus(400)
        req.session.address=req.query.address
        res.send(req.session.id)
        console.log(req.session.id)
    })

    app.post('/login', async (req, res) => {
        if (!req.query.address) return res.sendStatus(400)
        if (!req.query.signedData) return res.sendStatus(400)

        const requestedAddress = req.query.address.toLowerCase()
        const signerAddress = web3.eth.accounts.recover(req.session.id, req.query.signedData).toLowerCase()
        console.log(req.session.id)
        if (requestedAddress != signerAddress) return req.session.destroy() && res.sendStatus(401)
        req.session.address = signerAddress

        const usersModel = mongoose.model('users', usersSchema)
        const user = await usersModel.findOne({address: signerAddress})
        if (user) await usersModel.findOneAndUpdate({address: signerAddress}, {last_sign_in_timestamp: Date.now()})
        else await usersModel.create({
            address: signerAddress,
            first_sign_in_timestamp: Date.now(),
            last_sign_in_timestamp: Date.now(),
            referrer: null
        })

        res.status(200).send(`login success for ${signerAddress}!`)
    })

    app.post('/logout', auth, (req, res) => req.session.destroy() && res.status(200).send("logout success!") ) 
    app.get('*', (req, res) => res.status(200).send(`api alive, authorized: ${!!req.session?.address}`))
    app.listen(config.serverPort, () => console.log(`app running at ${config.serverPort}`))
})

const auth = (req, res, next) => req.session?.address ? next() : res.sendStatus(401)