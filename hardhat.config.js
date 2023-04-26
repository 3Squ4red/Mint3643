require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10000,
      },
    },
  },
  networks: {
    polygon_mumbai: {
      url: `https://rpc-mumbai.maticvigil.com/v1/${process.env.MUMBAI_RPC_API}`,
      accounts: [
        process.env.ACCOUNT1, // Token issuer (Tokeny)
        process.env.ACCOUNT2, // Claim Issuer
        process.env.ACCOUNT3, // User 1
        process.env.ACCOUNT4, // User 2
        process.env.ACCOUNT5, // Agent
      ],
    },
  },
};
