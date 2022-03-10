import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { constants } from 'ethers';
import { ethers } from 'hardhat';
import { WuWeiNFT } from '../typechain';

describe('WuWeiNFT', () => {
  let contract: WuWeiNFT;
  let owner: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let users: SignerWithAddress[];
  const MOCK_SUBSCRIPTION_ID = '0';
  const MOCK_LINK = constants.AddressZero;

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
    [owner, nonOwner] = users;
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

  describe('AccessControl to createCollectible function', () => {
    it('Only owner has default admin and minter roles', async () => {
      await contract.connect(owner).createCollectible();
      let totalSupply = await contract.totalSupply();
      expect(totalSupply).equal(ethers.BigNumber.from(1));

      await contract.connect(owner).createCollectible();
      totalSupply = await contract.totalSupply();
      expect(totalSupply).equal(ethers.BigNumber.from(2));
    });
    it('Non owner should not be able to call', async () => {
      await expect(contract.connect(nonOwner).createCollectible()).to.be
        .reverted;
    });
  });
});
