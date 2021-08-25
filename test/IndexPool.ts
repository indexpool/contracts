import {expect} from "chai";
import {ethers} from "hardhat";
import constants from "../constants";


describe("IndexPool", function () {
    let owner;
    let other;
    let provider;
    let IndexPool;
    let indexpool;
    let uniswapV2SwapBridge;
    let uniswapV2Router02;

    const ADDRESSES = constants['POLYGON'];
    const TOKENS = constants['POLYGON']['TOKENS'];

    beforeEach(async function () {
        [owner, other] = await ethers.getSigners();
        provider = await ethers.getDefaultProvider();

        IndexPool = await ethers.getContractFactory("IndexPool");
        indexpool = await IndexPool.deploy();

        let UniswapV2SwapBridge = await ethers.getContractFactory("UniswapV2SwapBridge");
        uniswapV2SwapBridge = await UniswapV2SwapBridge.deploy();

        uniswapV2Router02 = await ethers.getContractAt("IUniswapV2Router02", ADDRESSES["UNISWAP_V2_ROUTER"]);
    });

    describe("Create portfolio", function () {
        it("Create portfolio - with a deposit on ETH", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            let tx = await indexpool.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );

            // Wait transaction to complete
            tx.wait();

            // Wallet ETH balance should be above 0
            let walletAddress = await indexpool.walletOf(0);
            let walletBalance = await ethers.provider.getBalance(walletAddress);
            expect(walletBalance).to.be.above(0);
        })
        it("Create portfolio - with a Deposit on DAI", async function () {
            // Buy DAI on Uniswap
            var overrides = {value: ethers.utils.parseEther("1")};
            let blockNumber = await provider.getBlockNumber();
            let block = await provider.getBlock(blockNumber);

            await uniswapV2Router02.swapExactETHForTokens(
                1,
                [
                    TOKENS['WMAIN'],
                    TOKENS['DAI'],
                ],
                owner.address,
                block.timestamp + 100000,
                overrides
            )

            // Get DAI balance
            let dai = (await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["DAI"]));
            let daiBalance = await dai.balanceOf(owner.address);
            await dai.approve(indexpool.address, daiBalance);

            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            let tx = await indexpool.createPortfolio(
                {'tokens': [TOKENS['DAI']], 'amounts': [daiBalance]},
                _bridgeAddresses,
                _bridgeEncodedCalls,
            );

            // Wait transaction to complete
            tx.wait();

            // Wallet DAI balance should be above 0
            let walletAddress = await indexpool.walletOf(0);
            let walletDaiBalance = await dai.balanceOf(walletAddress);
            expect(walletDaiBalance).to.be.above(0);
        })
        it("Rejects mismatch in array size for input tokens and amounts", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio
            await expect(indexpool.createPortfolio(
                {'tokens': [TOKENS['DAI'], TOKENS['QUICK']], 'amounts': [100]},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            )).to.be.revertedWith("INDEXPOOL: MISMATCH IN LENGTH BETWEEN TOKENS AND AMOUNTS");
        })

        it("Rejects ERC20 amounts equal to zero", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio
            await expect(indexpool.createPortfolio(
                {'tokens': [TOKENS['DAI']], 'amounts': [0]},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            )).to.be.revertedWith("INDEXPOOL WALLET: ERC20 TOKENS AMOUNTS NEED TO BE > 0");
        })

        it("Rejects no ETH amounts along with empty ERC20 amounts", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio
            await expect(indexpool.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls
            )).to.be.revertedWith("INDEXPOOL: A AMOUNT IN ETHER OR ERC20 TOKENS IS NEEDED");
        })
    });

    describe("Deposit in a portfolio", function () {
        it("Deposit in a portfolio - with a deposit on ETH", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            let tx = await indexpool.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );

            // Wait transaction to complete
            tx.wait()
            // Code above was tested elsewhere

            // Wallet ETH balance should be above 0
            let walletAddress = await indexpool.walletOf(0);
            let previousWalletBalance = await ethers.provider.getBalance(walletAddress);

            // Deposit in a portfolio
            await indexpool.depositPortfolio(
                0, // NFT ID - NFT created just above
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );

            // Wallet ETH balance should be above 0
            let currentWalletBalance = await ethers.provider.getBalance(walletAddress);
            expect(currentWalletBalance).to.be.above(previousWalletBalance);
        })

        it("Deposit in a portfolio - with a deposit on DAI", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            await indexpool.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );

            // Buy DAI on Uniswap
            var overrides = {value: ethers.utils.parseEther("1")};
            let blockNumber = await provider.getBlockNumber();
            let block = await provider.getBlock(blockNumber);

            await uniswapV2Router02.swapExactETHForTokens(
                1,
                [
                    TOKENS['WMAIN'],
                    TOKENS['DAI'],
                ],
                owner.address,
                block.timestamp + 100000,
                overrides
            )

            // Get DAI balance
            let dai = (await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["DAI"]));
            let daiBalance = await dai.balanceOf(owner.address);
            await dai.approve(indexpool.address, daiBalance);

            // Deposit in a portfolio
            let tx = await indexpool.depositPortfolio(
                0, // NFT ID - NFT created just above
                {'tokens': [TOKENS['DAI']], 'amounts': [daiBalance]},
                _bridgeAddresses,
                _bridgeEncodedCalls,
            );

            // Wait for deposit to happen :)
            tx.wait();

            // Wallet DAI balance should be above 0
            let walletAddress = await indexpool.walletOf(0);
            let walletDaiBalance = await dai.balanceOf(walletAddress);
            expect(walletDaiBalance).to.be.above(0);
        })

        it("Rejects other address depositing in NFT", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            let tx = await indexpool.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );

            let otherIndexPool = indexpool.connect(other);

            await expect(otherIndexPool.depositPortfolio(
                0,
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            )).to.be.revertedWith("INDEXPOOL: ONLY NFT OWNER CAN CALL THIS FUNCTION");
        })

        it("Rejects mismatch in array size for input tokens and amounts", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            let tx = await indexpool.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );

            // Create a portfolio
            await expect(indexpool.depositPortfolio(
                0,
                {'tokens': [TOKENS['DAI'], TOKENS['QUICK']], 'amounts': [100]},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            )).to.be.revertedWith("INDEXPOOL: MISMATCH IN LENGTH BETWEEN TOKENS AND AMOUNTS");
        })

        it("Rejects ERC20 amounts equal to zero", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            let tx = await indexpool.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );

            // Create a portfolio
            await expect(indexpool.depositPortfolio(
                0,
                {'tokens': [TOKENS['DAI']], 'amounts': [0]},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            )).to.be.revertedWith("INDEXPOOL WALLET: ERC20 TOKENS AMOUNTS NEED TO BE > 0");
        })

        it("Rejects no ETH amounts along with empty ERC20 amounts", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            let tx = await indexpool.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );

            // Create a portfolio
            await expect(indexpool.depositPortfolio(
                0,
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
            )).to.be.revertedWith("INDEXPOOL: A AMOUNT IN ETHER OR ERC20 TOKENS IS NEEDED");
        })
    });

    describe("Withdraw from portfolio", function () {
        it("Withdraw from portfolio - in ETH", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            await indexpool.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );
            // Code above was tested elsewhere

            // Get ETH balance in owner's wallet before calling withdraw
            let previousBalance = await owner.getBalance()

            // Withdraw from portfolio
            await indexpool.withdrawPortfolio(
                0, // NFT ID - NFT created just above
                {'tokens': [], 'amounts': []},
                100000, // Withdraw percentage
                _bridgeAddresses,
                _bridgeEncodedCalls,
            );

            // Get ETH balance in owner's wallet after calling withdraw
            let currentBalance = await owner.getBalance()

            // Balance after withdrawing should be higher than before
            expect(currentBalance).to.be.above(previousBalance);
        })

        it("Withdraw from portfolio - in DAI", async function () {
            // Set bridges addresses
            var _bridgeAddresses = [
                uniswapV2SwapBridge.address,
            ];

            // Set path
            let pathUniswap = [
                TOKENS['WMAIN'],
                TOKENS['DAI'],
            ];

            // Set encoded calls
            var _bridgeEncodedCalls = [
                uniswapV2SwapBridge.interface.encodeFunctionData(
                    "tradeFromETHToTokens",
                    [
                        ADDRESSES['UNISWAP_V2_ROUTER'],
                        100000,
                        1,
                        pathUniswap
                    ],
                ),
            ];

            // Create a portfolio (just holds ether)
            await indexpool.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );
            // Code above was tested elsewhere

            // Get DAI balance in owner's wallet before calling withdraw
            let dai = (await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", TOKENS["DAI"]));
            let previousDaiBalance = await dai.balanceOf(owner.address);

            // Withdraw from portfolio
            await indexpool.withdrawPortfolio(
                0, // NFT ID - NFT created just above
                {'tokens': [TOKENS['DAI']], 'amounts': [100000]}, // outputs
                0, // Withdraw percentage
                [], // _bridgeAddresses
                [], // _encodedBridgeCalls
            );

            // Get ETH balance in owner's wallet after calling withdraw
            let currentDaiBalance = await dai.balanceOf(owner.address);

            // Balance after withdrawing should be higher than before
            expect(currentDaiBalance).to.be.above(previousDaiBalance);
        })

        it("Rejects other address withdrawing from NFT", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            let tx = await indexpool.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );

            let otherIndexPool = indexpool.connect(other);

            await expect(otherIndexPool.withdrawPortfolio(
                0, // NFT ID - NFT created just above
                {'tokens': [], 'amounts': []},
                100000, // Withdraw percentage
                _bridgeAddresses,
                _bridgeEncodedCalls,
            )).to.be.revertedWith("INDEXPOOL: ONLY NFT OWNER CAN CALL THIS FUNCTION");
        })

        it("Rejects mismatch in array size for output tokens and amounts", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            let tx = await indexpool.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );

            // Create a portfolio
            await expect(indexpool.withdrawPortfolio(
                0, // NFT ID - NFT created just above
                {'tokens': [TOKENS['DAI'], TOKENS['QUICK']], 'amounts': [100]},
                100000, // Withdraw percentage
                _bridgeAddresses,
                _bridgeEncodedCalls,
            )).to.be.revertedWith("INDEXPOOL: MISMATCH IN LENGTH BETWEEN TOKENS AND AMOUNTS");
        })

        it("Rejects ERC20 amounts equal to zero", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            let tx = await indexpool.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );

            // Create a portfolio
            await expect(indexpool.withdrawPortfolio(
                0, // NFT ID - NFT created just above
                {'tokens': [TOKENS['DAI']], 'amounts': [0]},
                100000, // Withdraw percentage
                _bridgeAddresses,
                _bridgeEncodedCalls,
            )).to.be.revertedWith("INDEXPOOL WALLET: ERC20 TOKENS AMOUNTS NEED TO BE > 0");
        })

        it("Rejects no ETH amounts along with empty ERC20 amounts", async function () {
            // Set bridges addresses and encoded calls
            var _bridgeAddresses = [];
            var _bridgeEncodedCalls = [];

            // Create a portfolio (just holds ether)
            let tx = await indexpool.createPortfolio(
                {'tokens': [], 'amounts': []},
                _bridgeAddresses,
                _bridgeEncodedCalls,
                {value: ethers.utils.parseEther("1")} // overrides
            );

            // Create a portfolio
            await expect(indexpool.withdrawPortfolio(
                0, // NFT ID - NFT created just above
                {'tokens': [], 'amounts': []},
                0, // Withdraw percentage
                _bridgeAddresses,
                _bridgeEncodedCalls,
            )).to.be.revertedWith("INDEXPOOL: A AMOUNT IN ETHER OR ERC20 TOKENS IS NEEDED");
        })
    });
});