import { expect } from "chai";
import { ethers } from "hardhat";
import constants from "../constants";

describe("Deposit", function () {
  let Pool;
  let hardhatPool;
  let owner;
  let oracle;

  const BASE_ASSET = BigInt(1000000000000000000);
  const ADDRESSES = constants['POLYGON'];


  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    let Oracle = await ethers.getContractFactory("OraclePath");

    oracle = (await Oracle.deploy(ADDRESSES['FACTORY'])).connect(owner);

    // Get the ContractFactory
    Pool = await ethers.getContractFactory("Pool");

    // To deploy our contract, we just have to call Pool.deploy() and await
    // for it to be deployed(), which happens onces its transaction has been
    // mined.
    hardhatPool = (await Pool.deploy(ADDRESSES['ROUTER'], oracle.address)).connect(owner)

    await hardhatPool.createIndex(
      [ADDRESSES['TOKENS'][0]], // address[] _tokens
      [1000000000],  // uint256[] _allocation,
      [[ADDRESSES['TOKENS'][0], ADDRESSES['WMAIN']]] // paths
    );
  });

   it("Deposits and buys an index of single token", async function () {
    const initialBalance = await owner.getBalance();

    // DEPOSIT
    let overrides = { value: ethers.utils.parseEther("1.1") };
    const deposit_result = await hardhatPool.deposit(
      0, // _index_id
      [[ADDRESSES['WMAIN'], ADDRESSES['TOKENS'][0]]], // paths
      overrides
    );

    expect(await hardhatPool.getTokenBalance(0, ADDRESSES['TOKENS'][0], owner.getAddress())).to.above(0);
    expect(await owner.getBalance()).to.be.below(initialBalance);
  })

  it("Rejects small deposits", async function () {
    await expect(hardhatPool.deposit(
      0, // _index_id
      [[ADDRESSES['WMAIN'], ADDRESSES['TOKENS'][0]]]
    )).to.be.revertedWith('MINIMUM DEPOSIT OF 0.001 MATIC');
  })

  it("Rejects big deposits", async function () {
    // DEPOSIT
    let overrides = { value: ethers.utils.parseEther("101") };
    await expect(hardhatPool.deposit(
      0, // _index_id
      [[ADDRESSES['WMAIN'], ADDRESSES['TOKENS'][0]]], // paths
      overrides
    )).to.be.revertedWith('EXCEEDED MAXIMUM ALLOWED DEPOSIT VALUE');  
  })

  it("Rejects wrong path", async function () {
    // DEPOSIT
    let overrides = { value: ethers.utils.parseEther("10") };
    await expect(hardhatPool.deposit(
      0, // _index_id
      [[ADDRESSES['TOKENS'][0], ADDRESSES['WMAIN']]], // paths
      overrides
    )).to.be.revertedWith('WRONG PATH: TOKEN NEEDS TO BE PART OF PATH');  
  })

  it("Increase deposit limit", async function () {   
    let overrides = { value: ethers.utils.parseEther("101") };
    await hardhatPool.setMaxDeposit(BigInt(200) * BASE_ASSET);

    await hardhatPool.deposit(
      0, // _index_id
      [[ADDRESSES['WMAIN'], ADDRESSES['TOKENS'][0]]], // paths
      overrides
    );

    overrides = { value: ethers.utils.parseEther("201") };
    await expect(hardhatPool.deposit(
      0, // _index_id
      [[ADDRESSES['WMAIN'], ADDRESSES['TOKENS'][0]]], // paths
      overrides
    )).to.be.revertedWith('EXCEEDED MAXIMUM ALLOWED DEPOSIT VALUE');     
  })
})

