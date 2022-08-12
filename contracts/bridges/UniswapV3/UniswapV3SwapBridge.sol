// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;
pragma abicoder v2;

import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import "../interfaces/IUniswapV3Swap.sol";
import "./interfaces/UniV3Pool.sol";

/// @custom:security-contact hi@defibasket.org
contract UniswapV3SwapBridge is IUniswapV3Swap {
    ISwapRouter constant swapRouter = ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

    function swapTokenToToken(
        bytes calldata encodedCall,
        address[] calldata tokenPath,
        uint256 amountInPercentage,
        uint256 minAmountOut)
    external override {
        uint256 amountIn = IERC20(tokenPath[0]).balanceOf(address(this)) * amountInPercentage / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(tokenPath[0]).approve(address(swapRouter), 0);
        IERC20(tokenPath[0]).approve(address(swapRouter), amountIn);

        ISwapRouter.ExactInputParams memory params = ISwapRouter.ExactInputParams({
            path : encodedCall,
            recipient : address(this),
            deadline : block.timestamp + 100000,
            amountIn : amountIn,
            amountOutMinimum : minAmountOut
        });

        uint256 amountOut = swapRouter.exactInput(params);
        emit DEFIBASKET_UNISWAPV3_SWAP(amountIn, amountOut);
    }

    function swapTokenToTokenWithPool(
        address pool,
        address[] calldata tokenPath,
        uint256 amountInPercentage,
        uint256 minAmountOut)
    external override {
        uint256 amountIn = IERC20(tokenPath[0]).balanceOf(address(this)) * amountInPercentage / 100000;

        // Approve 0 first as a few ERC20 tokens are requiring this pattern.
        IERC20(tokenPath[0]).approve(address(swapRouter), 0);
        IERC20(tokenPath[0]).approve(address(swapRouter), amountIn);

        bytes memory encodedCall = abi.encode(tokenPath[0], UniV3Pool(pool).fee(), tokenPath[1]);

        ISwapRouter.ExactInputParams memory params = ISwapRouter.ExactInputParams({
            path : encodedCall,
            recipient : address(this),
            deadline : block.timestamp + 100000,
            amountIn : amountIn,
            amountOutMinimum : minAmountOut
        });

        uint256 amountOut = swapRouter.exactInput(params);
        emit DEFIBASKET_UNISWAPV3_SWAP(amountIn, amountOut);
    }
}
