import {ethers} from "hardhat";
import constants from "../constants";
import {BigNumber} from "ethers";
import {MongoClient} from "mongodb";

const weiToString = (wei) => {
    return wei
        .div(
            BigNumber.from(10).pow(14)
        )
        .toNumber() / Math.pow(10, 4);
}

const getDeployedAddress = async (contractName, client) => {
    return (await client
        .db('indexpool')
        .collection('contracts')
        .findOne(
            {
                'name': contractName
            }
        ))['address'];
}

async function main() {
    const ADDRESSES = constants['POLYGON'];
    const TOKENS = constants['POLYGON']['TOKENS'];

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    let indexPool = await ethers.getContractAt("IndexPool",
        await getDeployedAddress("IndexPool", client));

    let uniswapV2SwapBridge = await ethers.getContractAt("QuickswapSwapBridge",
        await getDeployedAddress("QuickswapSwapBridge", client));

    let aaveV2DepositBridge = await ethers.getContractAt("AaveV2DepositBridge",
        await getDeployedAddress("AaveV2DepositBridge", client));

    let quickswapLiquidityBridge = await ethers.getContractAt("QuickswapLiquidityBridge",
        await getDeployedAddress("QuickswapLiquidityBridge", client));

    let autofarm = await ethers.getContractAt("AutofarmDepositBridge",
        await getDeployedAddress("AutofarmDepositBridge", client));

    let wMaticBridge = await ethers.getContractAt("WMaticBridge",
        await getDeployedAddress("WMaticBridge", client));

    const [deployer] = await ethers.getSigners();
    const balanceBegin = await deployer.getBalance();
    console.log("Deploying from:", deployer.address);
    console.log("Account balance:", weiToString(balanceBegin));

    const _bridgeAddresses = [
        autofarm.address,
        quickswapLiquidityBridge.address,
        uniswapV2SwapBridge.address,
        uniswapV2SwapBridge.address,
        wMaticBridge.address,
    ];
    const _bridgeEncodedCalls = [
        autofarm.interface.encodeFunctionData(
            "withdraw",
            [
                8, // uint256 poolId
                100000, // uint256 percentageIn
            ],
        ),
        quickswapLiquidityBridge.interface.encodeFunctionData(
            "removeLiquidity",
            [
                [TOKENS['WETH'], TOKENS['QUICK'],], // address[] tokens,
                100000, // uint256[] percentage,
                [1, 1,], // uint256[] minAmounts
            ],
        ),
        uniswapV2SwapBridge.interface.encodeFunctionData(
            "swapTokenToToken",
            [
                100000,
                1,
                [
                    TOKENS['WETH'],
                    TOKENS['WMAIN']
                ]
            ],
        ),
        uniswapV2SwapBridge.interface.encodeFunctionData(
            "swapTokenToToken",
            [
                100000,
                1,
                [
                    TOKENS['QUICK'],
                    TOKENS['WMAIN']
                ]
            ],
        ),
        wMaticBridge.interface.encodeFunctionData(
            "unwrap",
            [
                100000
            ],
        ),
    ];

    let startingNonce = await deployer.getTransactionCount();

    await indexPool.withdrawPortfolio(
        0,
        {'tokens': [], 'amounts': []},
        100000,
        _bridgeAddresses,
        _bridgeEncodedCalls,
        {gasLimit: 6000000, nonce:startingNonce}
    );

    console.log("Withdraw succeeded:", weiToString(balanceBegin));
    console.log("Account balance:", weiToString(balanceBegin));

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
