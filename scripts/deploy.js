const { deployIdentityProxy } = require("./helpers/proxy");

async function main() {
  const accounts = await ethers.getSigners();
  const claimTopics = [1, 7, 3];
  // entities
  const tokeny = accounts[0];
  const claimIssuer = accounts[1];
  const user1 = accounts[2];
  const user2 = accounts[3];
  const agent = accounts[8];

  const signer = ethers.Wallet.createRandom();
  const signerKey = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(["address"], [signer.address])
  );

  // Token essentials
  // factories
  const ClaimTopicsRegistry = await ethers.getContractFactory(
    "ClaimTopicsRegistry"
  );
  const IdentityRegistryStorage = await ethers.getContractFactory(
    "IdentityRegistryStorage"
  );
  const TrustedIssuersRegistry = await ethers.getContractFactory(
    "TrustedIssuersRegistry"
  );
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const Compliance = await ethers.getContractFactory("DefaultCompliance");
  const Token = await ethers.getContractFactory("Token");
  const Proxy = await ethers.getContractFactory("TokenProxy");
  const ImplementationAuthority = await ethers.getContractFactory(
    "ImplementationAuthority"
  );
  const ClaimIssuer = await ethers.getContractFactory("ClaimIssuer");
  const AgentManager = await ethers.getContractFactory("AgentManager");
  // const OwnerManager = await ethers.getContractFactory("OwnerManager");
  // const LimitCompliance = await ethers.getContractFactory("LimitHolder");
  // const DVDTransferManager = await ethers.getContractFactory(
  //   "DVDTransferManager"
  // );
  // const TestERC20 = await ethers.getContractFactory("TestERC20");
  // deploying
  const claimTopicsRegistry = await ClaimTopicsRegistry.deploy();
  await claimTopicsRegistry.deployed();
  const identityRegistryStorage = await IdentityRegistryStorage.deploy();
  await identityRegistryStorage.deployed();
  const trustedIssuersRegistry = await TrustedIssuersRegistry.deploy();
  await trustedIssuersRegistry.deployed();
  const identityRegistry = await IdentityRegistry.deploy(
    claimTopicsRegistry.address,
    identityRegistryStorage.address,
    trustedIssuersRegistry.address
  );
  await identityRegistry.deployed();
  const defaultCompliance = await Compliance.deploy();
  await defaultCompliance.deployed();
  let token = await Token.deploy();
  await token.deployed();

  // initing token
  const tokenOnchainID = await deployIdentityProxy(tokeny);
  const tokenName = "TREXDINO";
  const tokenSymbol = "TREX";
  const tokenDecimals = "0";
  await token
    .connect(tokeny)
    .init(
      identityRegistry.address,
      defaultCompliance.address,
      tokenName,
      tokenSymbol,
      tokenDecimals,
      tokenOnchainID.address
    );
  const implementationAuthority = await ImplementationAuthority.deploy(
    token.address
  );
  const proxy = await Proxy.deploy(
    implementationAuthority.address,
    identityRegistry.address,
    defaultCompliance.address,
    tokenName,
    tokenSymbol,
    tokenDecimals,
    tokenOnchainID.address
  );
  token = Token.attach(proxy.address);

  // identity contracts
  // CLAIM ISSUER
  const claimIssuerContract = await ClaimIssuer.connect(claimIssuer).deploy(
    claimIssuer.address
  );
  // claim issuer adds claim signer key to his contract
  await claimIssuerContract.connect(claimIssuer).addKey(signerKey, 3, 1);
  // USER1
  const user1Contract = await deployIdentityProxy(user1);
  // user1 gets signature from claim issuer
  const hexedData1 = ethers.utils.formatBytes32String(
    "Yea no, this guy is totes legit"
  );
  const hashedDataToSign1 = ethers.utils.solidityKeccak256(
    ["address", "uint256", "bytes"],
    [user1Contract.address, 7, hexedData1]
  );
  const signature1 = await signer.signMessage(
    ethers.utils.arrayify(hashedDataToSign1)
  );
  // user1 adds claim to identity contract
  await user1Contract
    .connect(user1)
    .addClaim(7, 1, claimIssuerContract.address, signature1, hexedData1, "");
  // USER2
  const user2Contract = await deployIdentityProxy(user2);
  // user2 gets signature from claim issuer
  const hexedData2 = ethers.utils.formatBytes32String(
    "Yea no, this guy is totes legit"
  );
  const hashedDataToSign2 = ethers.utils.solidityKeccak256(
    ["address", "uint256", "bytes"],
    [user2Contract.address, 7, hexedData2]
  );
  const signature2 = await signer.signMessage(
    ethers.utils.arrayify(hashedDataToSign2)
  );
  // user2 adds claim to identity contract
  await user2Contract
    .connect(user2)
    .addClaim(7, 1, claimIssuerContract.address, signature2, hexedData2, "");

  // --------------DEPLOYMENT AND INIT DONE-----------
  // Tokeny will bind the IdentityRegistry to the IdentityRegistryStorage
  await identityRegistryStorage
    .connect(tokeny)
    .bindIdentityRegistry(identityRegistry.address);
  // Tokeny will add an Agent to the Token
  await token.connect(tokeny).addAgentOnTokenContract(agent.address);
  // Tokeny adds trusted claim Topic to ClaimTopicsRegistry. Every investor will now have to have a claim of topic 7 in his identit contract
  await claimTopicsRegistry.connect(tokeny).addClaimTopic(7);
  // Tokeny adds trusted claim issuer to ClaimIssuerRegistry
  await trustedIssuersRegistry
    .connect(tokeny)
    .addTrustedIssuer(claimIssuerContract.address, claimTopics);
  // Agent adds identity contracts of the investors to the IdentityRegistry
  // but before that, Tokeny has to add an agent to the IdentityRegistry
  await identityRegistry
    .connect(tokeny)
    .addAgentOnIdentityRegistryContract(agent.address);
  await identityRegistry
    .connect(agent)
    .registerIdentity(user1.address, user1Contract.address, 91);
  // await identityRegistry
  //   .connect(agent)
  //   .registerIdentity(user2.address, user2Contract.address, 101);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
