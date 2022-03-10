# Dynamic NFT

This hardhat project is inspired by Zak Ayesh's [DynamicNFT](https://github.com/ZakAyesh/DynamicNFT) but uses Chainlink's VRF v2 (instead of v1) and supports typescript. It also includes mock test that uses `MockVRFCoordinator`.

The smart contract `WuWeiNFT` is the smart contract that make the NFT becomes "dynamic". This means the metadata changes as the token is transferred from one owner to another.

This project focuses on the mock test and to test my understanding of the said technique. Therefore it does not contain task to deploy to any network.
