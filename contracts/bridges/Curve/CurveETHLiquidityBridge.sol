// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ICurveETHPool.sol";
import "./interfaces/ICurveRewardGauge.sol";
import "./interfaces/ICurveAddressRegistry.sol";
import "./interfaces/ICurvePoolsRegistry.sol";
import "../interfaces/ICurveLiquidity.sol";

/**
 * @title CurveLiquidityBridge
 * @author DeFi Basket
 *
 * @notice Adds/remove liquidity from Curve pools
 *
 * @dev This contract adds or removes liquidity from Curve pools
 *
 */
/// @custom:security-contact hi@defibasket.org
contract CurveETHLiquidityBridge is ICurveLiquidity {
    /**
      * @notice Joins a Curve pool using multiple ERC20 tokens and stake the received LP token
      *
      * @dev Wraps add_liquidity and generate the necessary events to communicate with DeFi Basket's UI and back-end.
      *      Note: This function does not automatically stake the LP token.
      *      Note: This function could be optimized if we remove `tokens` argument
      *
      * @param poolAddress The address of the pool that Wallet will join
      * @param tokens Tokens that will be added to pool. Should be sorted according to the Curve's pool order, otherwise function will revert
      * @param percentages Percentages of the balance of ERC20 tokens that will be added to the pool.
      * @param minAmountOut Minimum amount of LP token that should be received from the pool
      */
    function addLiquidity(
        address poolAddress,
        address[] calldata tokens, /* Must be in the same order as the array returned by underlying_coins (or coins) */
        uint256[] calldata percentages,
        uint256 minAmountOut
    ) external override {
        uint256 numTokens = uint256(tokens.length);
        uint256[] memory amountsIn = new uint256[](numTokens);
        for (uint256 i = 0; i < numTokens; i = unchecked_inc(i)) {
            amountsIn[i] = IERC20(tokens[i]).balanceOf(address(this)) * percentages[i] / 100_000;
            // Approve 0 first as a few ERC20 tokens are requiring this pattern.
            IERC20(tokens[i]).approve(poolAddress, 0);
            IERC20(tokens[i]).approve(poolAddress, amountsIn[i]);
        }

        // Call the correct add_liquidity function according to tokens array size
        uint256 liquidity;
        if(numTokens == 2){
            uint256[2] memory amts = [amountsIn[0], amountsIn[1]];
            liquidity = ICurveBasePool(poolAddress).add_liquidity(amts, minAmountOut, false);
        }else if(numTokens == 3){
            uint256[3] memory amts = [amountsIn[0], amountsIn[1], amountsIn[2]];
            liquidity = ICurveBasePool(poolAddress).add_liquidity(amts, minAmountOut, false);
        }else if(numTokens == 4){
            uint256[4] memory amts = [amountsIn[0], amountsIn[1], amountsIn[2], amountsIn[3]];
            liquidity = ICurveBasePool(poolAddress).add_liquidity(amts, minAmountOut, false);
        }else if(numTokens == 5){
            uint256[5] memory amts = [amountsIn[0], amountsIn[1], amountsIn[2], amountsIn[3], amountsIn[4]];
            liquidity =  ICurveBasePool(poolAddress).add_liquidity(amts, minAmountOut, false);
        }else if(numTokens == 6){
            uint256[6] memory amts = [amountsIn[0], amountsIn[1], amountsIn[2], amountsIn[3], amountsIn[4], amountsIn[5]];
            liquidity = ICurveBasePool(poolAddress).add_liquidity(amts, minAmountOut, false);
        }else if(numTokens == 7){
            uint256[7] memory amts = [amountsIn[0], amountsIn[1], amountsIn[2], amountsIn[3], amountsIn[4], amountsIn[5], amountsIn[6]];
            liquidity = ICurveBasePool(poolAddress).add_liquidity(amts, minAmountOut, false);
        }else if(numTokens == 8){
            uint256[8] memory amts = [amountsIn[0], amountsIn[1], amountsIn[2], amountsIn[3], amountsIn[4], amountsIn[5], amountsIn[6], amountsIn[7]];
            liquidity = ICurveBasePool(poolAddress).add_liquidity(amts, minAmountOut, false);
        }else{
            revert("Unsupported number of tokens");
        }

        // Emit event
        emit DEFIBASKET_CURVE_ADD_LIQUIDITY(amountsIn, liquidity);
    }

    /**
      * @notice Unstake LP token from a Curve pool and withdraw assets
      *
      * @dev Wraps withdraw/remove_liquidity and generate the necessary events to communicate with DeFi Basket's UI and back-end.
      *
      * @param poolAddress The address of the pool that Wallet will withdraw assets
      * @param LPtokenAddress ERC20 address of the LP token (not the same as the pool)
      * @param percentageOut Percentages of LP token that will be withdrawn from the pool.
      * @param minAmountsOut Minimum amount of tokens that should be received from the pool. Should be in the same order than underlying_coins from the pool
      */
    function removeLiquidity(
        address poolAddress,
        address LPtokenAddress,
        uint256 percentageOut,
        uint256[] calldata minAmountsOut
    ) external override {
        uint256 numTokens = minAmountsOut.length;
        uint256 liquidity;

        liquidity = IERC20(LPtokenAddress).balanceOf(address(this)) * percentageOut / 100_000;

        // Call the correct remove_liquidity interface according to tokens array size
        if(numTokens == 2){
            uint256[2] memory min_amts = [minAmountsOut[0], minAmountsOut[1]];
            ICurveBasePool(poolAddress).remove_liquidity(liquidity, min_amts, false);
        }else if(numTokens == 3){
            uint256[3] memory min_amts = [minAmountsOut[0], minAmountsOut[1], minAmountsOut[2]];
            ICurveBasePool(poolAddress).remove_liquidity(liquidity, min_amts, false);
        }else if(numTokens == 4){
            uint256[4] memory min_amts = [minAmountsOut[0], minAmountsOut[1], minAmountsOut[2], minAmountsOut[3]];
            ICurveBasePool(poolAddress).remove_liquidity(liquidity, min_amts, false);
        }else if(numTokens == 5){
            uint256[5] memory min_amts = [minAmountsOut[0], minAmountsOut[1], minAmountsOut[2], minAmountsOut[3], minAmountsOut[4]];
            ICurveBasePool(poolAddress).remove_liquidity(liquidity, min_amts, false);
          }else if(numTokens == 6){
            uint256[6] memory min_amts = [minAmountsOut[0], minAmountsOut[1], minAmountsOut[2], minAmountsOut[3], minAmountsOut[4], minAmountsOut[5]];
            ICurveBasePool(poolAddress).remove_liquidity(liquidity, min_amts, false);    
        }else if(numTokens == 7){
            uint256[7] memory min_amts = [minAmountsOut[0], minAmountsOut[1], minAmountsOut[2], minAmountsOut[3], minAmountsOut[4], minAmountsOut[5], minAmountsOut[6]];
            ICurveBasePool(poolAddress).remove_liquidity(liquidity, min_amts, false);
        }else if(numTokens == 8){
            uint256[8] memory min_amts = [minAmountsOut[0], minAmountsOut[1], minAmountsOut[2], minAmountsOut[3], minAmountsOut[4], minAmountsOut[5], minAmountsOut[6], minAmountsOut[7]];
            ICurveBasePool(poolAddress).remove_liquidity(liquidity, min_amts, false);
        }else{
            revert("Unsupported number of tokens");
        }

        // Emit event
        emit DEFIBASKET_CURVE_REMOVE_LIQUIDITY(
            minAmountsOut, // random number just to keep signature working
            liquidity
        );
    }

    /**
      * @notice Increment integer without checking for overflow - only use in loops where you know the value won't overflow
      *
      * @param i Integer to be incremented
    */
    function unchecked_inc(uint256 i) internal pure returns (uint256) {
        unchecked {
            return i + 1;
        }
    }

    function removeLiquidityOneToken(
        address poolAddress,
        address LPTokenAddress,
        int128 tokenIndex,
        uint256 percentageOut,
        uint256 minAmountOut
    ) external override
    {
        uint256 liquidity = IERC20(LPTokenAddress).balanceOf(address(this)) * percentageOut / 100_000;
        uint256 amountOut = ICurveBasePool(poolAddress).remove_liquidity_one_coin(liquidity, tokenIndex, minAmountOut, false);
        emit DEFIBASKET_CURVE_REMOVE_LIQUIDITY_ONE_COIN(liquidity, amountOut);
    }
}





