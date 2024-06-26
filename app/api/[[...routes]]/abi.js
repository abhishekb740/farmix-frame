export const abi = [
    {
        "inputs": [],
        "name": "TipMustBeGreaterThanZero",
        "type": "error"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "TipReceived",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "tip",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    }
]