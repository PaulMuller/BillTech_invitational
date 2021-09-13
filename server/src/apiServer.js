require('dotenv').config({path: 'src/.env'})
const mongoose = require('mongoose')
const Web3 = require('web3')
const web3 = new Web3(process.env.BSC_RPC)
const app = require('express')()
const session = require('express-session')
const cors = require('cors')
const http = require('http').createServer(app)
const config = require("./config.json")
const usersSchema = require("./mongoSchemas.js").usersSchema
const paymentsSchema = require("./mongoSchemas.js").paymentsSchema
const debetPipeline = require("./mongoSchemas.js").debetPipeline

const entrophy = {}


const main = async() => {
    await connectToDataBase()
    launchClientServerHandlers()
}

const connectToDataBase = async() => {
    mongoose.connection.on('error', console.error.bind(console, `failed to connect to DB`))
    mongoose.connection.once('open', () => console.log(`connected to DB`))
    await mongoose.connect(process.env.DB_URL, config.mongoDBConnectionOptions)
    await mongoose.connections[0].createCollection(`ref_royalty`, {
        viewOn: `users`, 
        pipeline: debetPipeline
    })
}

const launchClientServerHandlers = () => {
    app.use(session({
        secret: '2C44-4D44-WppQ38S',
        resave: true,
        saveUninitialized: true
    }))

    app.use(cors())

    app.get('/requestAuthEntrophy', (req, res) => {
        if (!req.query.address) res.sendStatus(401)
        entrophy[req.query.address] = (Math.random()*1e18).toFixed()
        res.end(entrophy[req.query.address])
    })
    
    app.get('/login', async (req, res) => {
        if (!req.query.address || !req.query.signedData) return res.send('login failed')
        if (req.query.address.toLowerCase() === web3.eth.accounts.recover(entrophy[req.query.address] ,req.query.signedData).toLowerCase()) {
            const usersModel = mongoose.model(`users`, usersSchema)
            const user = await usersModel.findOne({address: req.query.address})
            if (!user) {
                await usersModel.create({
                    address: req.query.address,
                    first_sign_in_timestamp: Date.now(),
                    last_sign_in_timestamp: Date.now(),
                    is_owner: false,
                    referrer: ''
                })
            } else {
                await usersModel.findOneAndUpdate({address: req.query.address},{last_sign_in_timestamp: Date.now()})
            }
            req.session.address = req.query.address
            res.end(`login success for ${req.query.address}!`)
        }
    })
    
    app.get('/logout', (req, res) => {
        req.session.destroy()
        res.end("logout success!")
    })

    app.get('/content', auth, (req, res) => {
        res.send("You can only see this after you've logged in.")
    })
    
    app.get('*', (req, res) => res.sendStatus(200).send(`api works!`))
    http.listen(config.serverPort, () => console.log(`server starts to handle requests at the port "${config.serverPort}"`))
}

// Authentication and Authorization Middleware
const auth = (req, res, next) => {
    if (req.session && req.session.address)
      return next()
    else
      return res.sendStatus(401)
}



main()