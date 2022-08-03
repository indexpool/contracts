// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.6;

interface IJarvisV6Mint {
    event DEFIBASKET_JARVISV6_MINT (
        uint256 amountIn,
        uint256 amountOut
    );

    event DEFIBASKET_JARVISV6_REDEEM (
        uint256 amountIn,
        uint256 amountOut
    );

    // Note: function addLiquidity does not stakes the LP token
    function mint(
        address synthereumAddress,
        address assetIn,
        uint256 percentageIn,
        address assetOut,
        uint256 minAmountOut)
    external;

    function redeem(
        address synthereumAddress,
        address assetIn,
        uint256 percentageIn,
        address assetOut,
        uint256 minAmountOut
    ) external;
}
