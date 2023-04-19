const { ethers, upgrades } = require("hardhat");
const onchainid = require("@onchain-id/solidity");

async function deployIdentityProxy(identityIssuer) {
  // factories
  const Identity = await ethers.getContractFactory("Identity");
  const ImplementationAuthority = await ethers.getContractFactory(
    "ImplementationAuthority"
  );

  // deployment
  const identity = await Identity.connect(identityIssuer).deploy(
    identityIssuer.address,
    true
  );
  await identity.deployed();
  const implementationAuthority = await ImplementationAuthority.deploy(
    identity.address
  );
  await implementationAuthority.deployed();

  const contractProxy = new ethers.ContractFactory(
    onchainid.contracts.IdentityProxy.abi,
    onchainid.contracts.IdentityProxy.bytecode,
    ethers.provider.getSigner()
  );

  const proxy = await contractProxy.deploy(
    implementationAuthority.address,
    identityIssuer.address,
    { gasLimit: 3000000, gasPrice: ethers.utils.parseUnits("80", "gwei") }
  );
  await proxy.deployed();

  return Identity.attach(proxy.address);
}

module.exports = {
  deployIdentityProxy,
};
