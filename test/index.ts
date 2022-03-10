import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { constants } from 'ethers';
import { ethers } from 'hardhat';
import { WuWeiNFT } from '../typechain';

describe('WuWeiNFT', () => {
  let contract: WuWeiNFT;
  let owner: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let newOwner: SignerWithAddress;
  let users: SignerWithAddress[];
  const MOCK_SUBSCRIPTION_ID = '0';
  const MOCK_LINK = constants.AddressZero;

  const URIs = [
    'https://ipfs.io/ipfs/QmZ8epAYRBVgmC89AkhMcYTvSXqaXoVyY1wDejcts8YfrF?filename=metadata1.json',
    'https://ipfs.io/ipfs/QmYouRy6h83ifpmTx4MpN6rhg3ByCxhDBCAYsBFWPngjhX?filename=metadata2.json',
    'https://ipfs.io/ipfs/QmVsTvG8m5pZFCG9oaTRCxfFFzEHzi1YfptTgqX1h6xjKu?filename=metadata3.json',
  ];

  async function deployContract(
    vrfCoordinatorContract:
      | 'MockVRFCoordinator'
      | 'MockVRFCoordinatorUnfulfillable' = 'MockVRFCoordinator',
  ) {
    const contractFactory = await ethers.getContractFactory('WuWeiNFT');

    const vrfCoordFactory = await ethers.getContractFactory(
      vrfCoordinatorContract,
    );
    const mockVrfCoordinator = await vrfCoordFactory.connect(owner).deploy();

    return await contractFactory
      .connect(owner)
      .deploy(mockVrfCoordinator.address, MOCK_LINK, MOCK_SUBSCRIPTION_ID);
  }

  beforeEach(async () => {
    users = await ethers.getSigners();
    [owner, nonOwner, newOwner] = users;
    contract = await deployContract();
  });

  describe('ERC721', () => {
    it('name', async () => {
      const name = await contract.name();
      expect(name).to.equal('WuWeiNFT');
    });
    it('symbol', async () => {
      const symbol = await contract.symbol();
      expect(symbol).to.equal('WWNFT');
    });
  });

  // function createCollectible() public onlyRole(MINTER_ROLE) {
  //   uint256 tokenId = _tokenIdCounter.current();
  //   _tokenIdCounter.increment();

  //   string memory initialUri = IpfsUri[2];
  //   EigenValue initialEigenVal = EigenValue(2);
  //   _safeMint(msg.sender, tokenId);
  //   _setTokenURI(tokenId, initialUri);
  //   tokenIdToEigenValue[tokenId] = initialEigenVal;
  // }
  describe('createCollectible', () => {
    it('Only owner has default admin and minter roles', async () => {
      await contract.connect(owner).createCollectible();
      let totalSupply = await contract.totalSupply();
      expect(totalSupply).equal(ethers.BigNumber.from(1));

      const tokenId_0 = await contract.tokenByIndex(0);
      expect(tokenId_0).equal(ethers.BigNumber.from(0));

      await contract.connect(owner).createCollectible();
      totalSupply = await contract.totalSupply();
      expect(totalSupply).equal(ethers.BigNumber.from(2));

      const tokenId_1 = await contract.tokenByIndex(1);
      expect(tokenId_1).equal(ethers.BigNumber.from(1));
    });
    it('tokenURI should retrieves the last index', async () => {
      let tokenId = 0;
      await contract.connect(owner).createCollectible();
      let uri = await contract.tokenURI(tokenId);
      expect(uri).equal(URIs[2]);
    });
    it('owner', async () => {
      let tokenId = 0;
      await contract.connect(owner).createCollectible();
      expect(await contract.ownerOf(tokenId)).equal(owner.address);
    });
    it('Non owner should not be able to call', async () => {
      await expect(contract.connect(nonOwner).createCollectible()).to.be
        .reverted;
    });
  });

  // function transferFrom(
  //   address from,
  //   address to,
  //   uint256 tokenId
  // ) public override(ERC721) {
  //   uint256 requestId = COORDINATOR.requestRandomWords(
  //     keyHash,
  //     s_subscriptionId,
  //     requestConfirmations,
  //     callbackGasLimit,
  //     numWords
  //   );
  //   requestIdToTokenId[requestId] = tokenId;
  //   _transfer(from, to, tokenId);
  // }
  describe('transferFrom', () => {
    it('Check new ownership after transfer', async () => {
      await contract.connect(owner).createCollectible();
      const tokenId = 0;
      await contract.transferFrom(owner.address, newOwner.address, tokenId);

      expect(await contract.ownerOf(tokenId)).equal(newOwner.address);
    });

    it('Check if the URI and Eigenvalue change', async () => {
      let egv;
      const tokenId = 0;
      await contract.connect(owner).createCollectible();
      let uri = await contract.tokenURI(tokenId);
      console.log(uri);
      egv = await contract.tokenIdToEigenValue(tokenId);
      console.log(egv);

      await contract.transferFrom(owner.address, newOwner.address, tokenId);
      expect(await contract.ownerOf(tokenId)).equal(newOwner.address);

      // Hopefully the URI and EigenValue changes!
      uri = await contract.tokenURI(tokenId);
      console.log(uri);
      egv = await contract.tokenIdToEigenValue(tokenId);
      console.log(egv);
    });
  });
});
