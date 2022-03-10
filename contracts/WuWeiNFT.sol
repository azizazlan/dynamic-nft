//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import 'hardhat/console.sol';

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/utils/Counters.sol';

import '@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol';
import '@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol';
import '@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol';

contract WuWeiNFT is
  ERC721,
  ERC721Enumerable,
  ERC721URIStorage,
  AccessControl,
  VRFConsumerBaseV2
{
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIdCounter;

  // Create a new role identifier for the minter role
  bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');

  VRFCoordinatorV2Interface internal COORDINATOR;
  LinkTokenInterface internal LINKTOKEN;

  // Your subscription ID.
  uint64 internal s_subscriptionId;

  // The gas lane to use, which specifies the maximum gas price to bump to.
  // For a list of available gas lanes on each network,
  // see https://docs.chain.link/docs/vrf-contracts/#configurations
  bytes32 internal keyHash =
    0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc;

  // Depends on the number of requested values that you want sent to the
  // fulfillRandomWords() function. Storing each word costs about 20,000 gas,
  // so 100,000 is a safe default for this example contract. Test and adjust
  // this limit based on the network that you select, the size of the request,
  // and the processing of the callback request in the fulfillRandomWords()
  // function.
  uint32 internal callbackGasLimit = 300000;

  // The default is 3, but you can set this higher.
  uint16 internal requestConfirmations = 3;

  // Cannot exceed VRFCoordinatorV2.MAX_NUM_WORDS.
  uint32 internal numWords = 1;

  uint256 public s_requestId;

  enum EigenValue {
    HESLEEP,
    HEATTAC,
    SUPERPOSITION
  }

  // This points to the metadata for each unique piece of art on Ipfs.
  string[] IpfsUri = [
    'https://ipfs.io/ipfs/QmZ8epAYRBVgmC89AkhMcYTvSXqaXoVyY1wDejcts8YfrF?filename=metadata1.json',
    'https://ipfs.io/ipfs/QmYouRy6h83ifpmTx4MpN6rhg3ByCxhDBCAYsBFWPngjhX?filename=metadata2.json',
    'https://ipfs.io/ipfs/QmVsTvG8m5pZFCG9oaTRCxfFFzEHzi1YfptTgqX1h6xjKu?filename=metadata3.json'
  ];

  mapping(uint256 => EigenValue) public tokenIdToEigenValue;
  mapping(uint256 => uint256) requestIdToTokenId;

  constructor(
    address vrfCoordinator,
    address link,
    uint64 subscriptionId
  ) ERC721('WuWeiNFT', 'WWNFT') VRFConsumerBaseV2(vrfCoordinator) {
    // Access control
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(MINTER_ROLE, msg.sender);

    s_subscriptionId = subscriptionId;
    COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
    LINKTOKEN = LinkTokenInterface(link);
  }

  // Creates a new ERC721 mNFT.
  // It is initialized at the third IpfsUri and EigenValue
  function createCollectible() public onlyRole(MINTER_ROLE) {
    uint256 tokenId = _tokenIdCounter.current();
    _tokenIdCounter.increment();

    string memory initialUri = IpfsUri[2];
    EigenValue initialEigenVal = EigenValue(2);
    _safeMint(msg.sender, tokenId);
    _setTokenURI(tokenId, initialUri);
    tokenIdToEigenValue[tokenId] = initialEigenVal;
  }

  // Override's default ERC721 transferFrom function to call VRF.
  /* Since the VRF is asynchronous we use a requestIdToTokenId 
     to map all VRF requests to the token we are transferring. */
  // This VRF request replaces the user provided seed with the block number.
  function transferFrom(
    address from,
    address to,
    uint256 tokenId
  ) public override(ERC721) {
    uint256 requestId = COORDINATOR.requestRandomWords(
      keyHash,
      s_subscriptionId,
      requestConfirmations,
      callbackGasLimit,
      numWords
    );
    requestIdToTokenId[requestId] = tokenId;
    _transfer(from, to, tokenId);
  }

  function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
    internal
    override
  {
    uint256 _tokenId = requestIdToTokenId[requestId];
    uint256 random2 = (randomWords[0] % 2);
    EigenValue newEigenVal = EigenValue(random2);
    string memory newUri = IpfsUri[random2];
    tokenIdToEigenValue[_tokenId] = newEigenVal;
    _setTokenURI(_tokenId, newUri);
  }

  // The following functions are overrides required by Solidity.

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal override(ERC721, ERC721Enumerable) {
    super._beforeTokenTransfer(from, to, tokenId);
  }

  function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
    super._burn(tokenId);
  }

  function tokenURI(uint256 tokenId)
    public
    view
    override(ERC721, ERC721URIStorage)
    returns (string memory)
  {
    return super.tokenURI(tokenId);
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721, ERC721Enumerable, AccessControl)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }
}
