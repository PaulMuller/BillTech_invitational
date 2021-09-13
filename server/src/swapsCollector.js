require('dotenv').config({path: 'src/.env'})
const config = require('./config.json')
const Web3 = require('web3')// require manual issue fix https://github.com/dvcrn/web3.js/commit/b868c5fece70fba6d34b577ef59f3fa3159390ad 
const web3 = new Web3(process.env.BSC_RPC)
const routerAbi = require('./abis/routerAbi.json')
const InputDataDecoder = require('ethereum-input-data-decoder')
const decoder = new InputDataDecoder(routerAbi)
const BN = require('bn.js')
const mongoose = require('mongoose')
const swapSchema = require("./mongoSchemas.js").swapSchema
const db = mongoose.connection

const SWAP_EVENT_TOPIC0 = '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822'
const SWAP_SIGNATURES_LIST = routerAbi
    .filter(abiItem => abiItem.name?.startsWith('swap'))
    .map(web3.eth.abi.encodeFunctionSignature)


const main = async () => {
    await mongoose.connect(process.env.DB_URL, config.mongoDBConnectionOptions)
    const swapModel         = mongoose.model(`swaps`, swapSchema)

    while(1){
        const lastStoredBlock   = (await swapModel.findOne().sort({block_number: -1})).block_number
        const currentBlock      = await web3.eth.getBlockNumber()
    
        console.log(`start from ${lastStoredBlock} to ${currentBlock} =>`)
        for (let i = lastStoredBlock; i < currentBlock; i++) {
            const swapsInBlock = await getSwapsInBlock(i)
            await swapModel.insertMany(swapsInBlock, { ordered: false }, (error, docs) => {
                if (error) console.log('\tnote: ' + error.message)
                console.log(`\t${i}/${currentBlock} synced with ${docs?.length || 0} swaps`)
            })
        }

        await sleep(10000)
    }
}



const getSwapsInBlock = async blockNumber => {
    const block = await web3.eth.getBlock(blockNumber, true)
    const validTransactions = filterSwapTransactions(block.transactions)
    const res = []

    for (let i = 0; i < validTransactions.length; i++) {
        const tx        = validTransactions[i]
        const txReceipt = await web3.eth.getTransactionReceipt(tx.hash)
        if (!txReceipt.status) continue
        const swapLogs              = filterSwapTransactionReceiptLogs(txReceipt.logs)
        const actualSwapAmounts     = extractSwapAmounts(swapLogs)
        const decodedFunctionInput  = decoder.decodeData(tx.input)

        const recoveredObject = Object.fromEntries(decodedFunctionInput.names.map( (el, i) => [
            el, 
            web3.utils.isBN(decodedFunctionInput.inputs[i]) ? decodedFunctionInput.inputs[i].toString() : decodedFunctionInput.inputs[i]
        ]))

        res.push({
            hash:           tx.hash,
            swapper:        tx.from,
            block_number:   tx.blockNumber,
            method:         decodedFunctionInput.method,
            value:          tx.value,
            token_in:       '0x' + recoveredObject.path[0],
            token_out:      '0x' + recoveredObject.path[recoveredObject.path.length -1],
            amount_in:      actualSwapAmounts[0],
            amount_out:     actualSwapAmounts[1]
        })
        await sleep(50)
    }

    return res
}

const extractSwapAmounts = swapLogs => {
    if (!swapLogs.length) return
    const inData = swapLogs[0].data.slice(2).match(/.{1,64}/g)
    const outData = swapLogs[swapLogs.length - 1].data.slice(2).match(/.{1,64}/g)
    const inAmount_1    = new BN(inData[0],  16)
    const inAmount_2    = new BN(inData[1],  16)
    const outAmount_1   = new BN(outData[2], 16)
    const outAmount_2   = new BN(outData[3], 16)

    return [
        inAmount_1.add(inAmount_2).toString(), 
        outAmount_1.add(outAmount_2).toString()
    ]
}

const filterSwapTransactions = transactions =>  
    transactions.filter(tx => tx.to === config.targetExchangeRouterAddress)//only to router
                .filter(tx => isSwapFunction(tx.input.slice(0,10)))//only swap functions

const filterSwapTransactionReceiptLogs = logs => 
    logs.filter(log => log.topics[0] === SWAP_EVENT_TOPIC0)//only 'swap' event
            
const isSwapFunction = signature => SWAP_SIGNATURES_LIST.indexOf(signature) > 0

const sleep = ms => new Promise(r => setTimeout(r, ms))


db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', () => console.log(`MongoDB now ready to save data`))
main()