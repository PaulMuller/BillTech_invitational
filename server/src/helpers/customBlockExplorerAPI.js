//useful for block explorers api providers developed behind Etherscan team
const axios = require('axios')

module.exports.getEvents = async (
    apiUrl,
    address,
    topic0,
    fromBlock = '0',
    toBlock = 'latest',
    apikey
) => {
    return new Promise(async (resolve, reject) => {
        if (!apiUrl && !address && !topic0 && !apikey) return reject(new Error(`Bad getEvents params: [${arguments.join(',')}]`))
        const url = `${apiUrl}api?module=logs&action=getLogs&fromBlock=${fromBlock}&toBlock=${toBlock}&address=${address}&topic0=${topic0}&apikey=${apikey || ''}`
        
        try{
            return resolve(await axios.get(url))//Automatic transforms for JSON data
        }catch (error) {
            return reject(error)
        }
    })
}

module.exports.getNormalTransactionsList = async (
    apiUrl,
    address,
    startBlock = '0',
    endBlock = 'latest',
    sort = 'asc',
    apikey
) => {
    return new Promise(async (resolve, reject) => {
        if (!apiUrl && !address && !apikey) return reject(new Error(`Bad getEvents params: [${arguments.join(',')}]`))
        const url = `${apiUrl}api?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=${endBlock}&sort=${sort}&apikey=${apikey || ''}`
        
        try{
            return resolve(await axios.get(url))//Automatic transforms for JSON data
        }catch (error) {
            return reject(error)
        }
    })
}

module.exports.getInternalTransactionsList = async (
    apiUrl,
    address,
    startBlock = '0',
    endBlock = 'latest',
    sort = 'asc',
    apikey
) => {
    return new Promise(async (resolve, reject) => {
        if (!apiUrl && !address && !apikey) return reject(new Error(`Bad getEvents params: [${arguments.join(',')}]`))
        const url = `${apiUrl}api?module=account&action=txlistinternal&address=${address}&startblock=${startBlock}&endblock=${endBlock}&sort=${sort}&apikey=${apikey || ''}`
        
        try{
            return resolve(await axios.get(url))//Automatic transforms for JSON data
        }catch (error) {
            return reject(error)
        }
    })
}

//https://api.bscscan.com/api?module=account&action=tokentx&address=0x7bb89460599dbf32ee3aa50798bbceae2a5f7f6a&startblock=0&endblock=2500000&sort=asc&apikey=YourApiKeyToken
module.exports.getTokenTransferEventsList = async (
    apiUrl,
    address,
    startBlock = '0',
    endBlock = 'latest',
    sort = 'asc',
    apikey
) => {
    return new Promise(async (resolve, reject) => {
        if (!apiUrl && !address && !apikey) return reject(new Error(`Bad getEvents params: [${arguments.join(',')}]`))
        const url = `${apiUrl}api?module=account&action=tokentx&address=${address}&startblock=${startBlock}&endblock=${endBlock}&sort=${sort}&apikey=${apikey || ''}`
        
        try{
            return resolve(await axios.get(url))//Automatic transforms for JSON data
        }catch (error) {
            return reject(error)
        }
    })
}