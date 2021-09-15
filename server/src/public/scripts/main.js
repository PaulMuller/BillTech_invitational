const web3 = new Web3(ethereum)
const serverApi = 'http://localhost:4000'

const blockExplorerURL = chainId => {
    switch (chainId) {
        case 1:     return "https://api.etherscan.io/" 
        case 56:    return "https://api.bscscan.com/" 
        case 137:   return "https://api.polygonscan.com/"  
        default:    return undefined
    }
}

const installAccount = () => {
    const connectButton     = document.getElementById('enableEthereumButton')
    const selectedAddress   = ethereum.selectedAddress
    connectButton.innerHTML = selectedAddress ? `${selectedAddress.slice(0,6)}...${selectedAddress.slice(38,44)}` : 'Connect metamask',
    connectButton.className = selectedAddress ? 'active' : 'notActive'
}

const installChainId = async () => {
    const earliest  = await web3.eth.getBlock('earliest')
    const latest    = await web3.eth.getBlock('latest')
    const blockTime = (latest.timestamp - earliest.timestamp) / latest.number
    document.getElementById('blockTime').innerHTML      = `blockTime: ${+blockTime.toFixed(2)} sec`
    document.getElementById('chainIdSpan').innerHTML    = `chainId: ${+ethereum.chainId}`
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const initiateMetamask = () => {
    installAccount()
    installChainId()
}

const enableEthereumButtonClickHandler = async () => {
    const isAccountPresent = !!(await ethereum.request({ method: 'eth_requestAccounts' }))
    const isMetamaskConnacted = await ethereum._metamask.isUnlocked()
    const isEthereumConnected = ethereum.isConnected()
    if (isAccountPresent && isMetamaskConnacted && isEthereumConnected) initiateMetamask()
}

const signInClickHandler = async () => {
    const sessionID = await fetch(`${serverApi}/requestLogin?address=${ethereum.selectedAddress}`, {
        method: 'GET',
        mode: 'cors',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include'
    })
    
    const signedData = await web3.eth.personal.sign(await sessionID.text(), ethereum.selectedAddress)

    const login_res = await fetch(`${serverApi}/login?address=${ethereum.selectedAddress}&signedData=${signedData}`, {
        method: 'POST',
        mode: 'cors',
        headers:  { 'Content-Type': 'application/json'},
        credentials: 'include'
    })
    document.getElementById('signIn').innerHTML = await login_res.text()
    // document.getElementById('get24hSwapsTurnovers').textContent = await JSON.stringify(await get24hSwapsTurnovers(10752450, 10752500))
}

const get24hSwapsTurnovers = async (blockStart, blockEnd) => {
    const data_res = await fetch(`${serverApi}/24hSwaps?blockStart=${blockStart}&blockEnd=${blockEnd}`, {
        method: 'GET',
        mode: 'cors',
        headers: {'Content-Type': 'application/json'}
    })
    console.log(await data_res.text())
    return await data_res.json()
}
  
ethereum.on('connect',          initiateMetamask)
ethereum.on('disconnect',       initiateMetamask)
ethereum.on('accountsChanged',  initiateMetamask)
ethereum.on('chainChanged',     initiateMetamask)
document.getElementById('enableEthereumButton').addEventListener('click', enableEthereumButtonClickHandler)
document.getElementById('signIn').addEventListener('click', signInClickHandler)



//web3.eth.personal.sign("Hello world", "0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe", "test password!")

