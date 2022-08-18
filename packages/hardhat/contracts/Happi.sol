pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import 'base64-sol/base64.sol';
import './HexStrings.sol';
// import "hardhat/console.sol";


abstract contract SmileContract {
  mapping(uint256 => bytes32) public genes;
  function renderTokenById(uint256 id) external virtual view returns (string memory);
  function transferFrom(address from, address to, uint256 id) external virtual;
}

contract Happi is ERC721Enumerable, IERC721Receiver {

  using Strings for uint256;
  using Strings for uint8;
  using HexStrings for uint160;
  using Counters for Counters.Counter;

  Counters.Counter private _tokenIds;

  SmileContract smile;
  mapping(uint256 => uint256[]) smileById;

  constructor(address _smile) ERC721("Happi", "HP") {
    smile = SmileContract(_smile);
  }

  function mintItem() public returns (uint256) {
      _tokenIds.increment();

      uint256 id = _tokenIds.current();
      _mint(msg.sender, id);

      return id;
  }

  function returnAllSmiles(uint256 _id) external {
    require(smileById[_id].length > 0, "No Joy!");
    require(msg.sender == ownerOf(_id), "Only a happy person can return smiles");
    for (uint256 i = 0; i < smileById[_id].length; i++) {
      smile.transferFrom(address(this), ownerOf(_id), smileById[_id][i]);
    }

    delete smileById[_id];
  }

  function tokenURI(uint256 id) public view override returns (string memory) {
      require(_exists(id), "not exist");
      string memory name = string(abi.encodePacked('#', id.toString(), ' Happi'));
      string memory description = string(abi.encodePacked('Add some colorful smiles and be Happi'));
      string memory image = Base64.encode(bytes(generateSVGofTokenById(id)));

      return string(abi.encodePacked(
        'data:application/json;base64,',
        Base64.encode(
            bytes(
                abi.encodePacked(
                    '{"name":"',
                    name,
                    '", "description":"',
                    description,
                    '", "external_url":"https://burnyboys.com/token/',
                    id.toString(),
                    '", "owner":"',
                    (uint160(ownerOf(id))).toHexString(20),
                    '", "image": "',
                    'data:image/svg+xml;base64,',
                    image,
                    '"}'
                )
            )
        )
      ));
  }

  function generateSVGofTokenById(uint256 id) internal view returns (string memory) {

    string memory svg = string(abi.encodePacked(
      '<svg width="370" height="370" xmlns="http://www.w3.org/2000/svg">',
        renderTokenById(id),
      '</svg>'
    ));

    return svg;
  }

  // Visibility is `public` to enable it being called by other contracts for composition.
  function renderTokenById(uint256 id) public view returns (string memory) {
    string memory render = string(abi.encodePacked(
       '<rect x="0" y="0" width="370" height="370" stroke="black" fill="#001649" stroke-width="5"/>',
       // - (0.3, the scaling factor) * smile (cx, cy).
       // Without this, the smile move in rectangle translated towards bottom-right.
       '<g transform="translate(0 -7)">',
       renderSmile(id),
       '</g>'
    ));

    return render;
  }

  function renderSmile(uint256 _id) internal view returns (string memory) {
    string memory smileSVG = "";

    for (uint8 i = 0; i < smileById[_id].length; i++) {
      uint16 blocksTraveled = uint16((block.number-blockAdded[smileById[_id][i]])%256);
      int8 speedX = int8(uint8(smile.genes(smileById[_id][i])[0]));
      int8 speedY = int8(uint8(smile.genes(smileById[_id][i])[1]));
      uint8 newX;
      uint8 newY;

      newX = newPos(
        speedX,
        blocksTraveled,
        x[smileById[_id][i]]);

      newY = newPos(
        speedY,
        blocksTraveled,
        y[smileById[_id][i]]);

      smileSVG = string(abi.encodePacked(
        smileSVG,
        '<g>',
        '<animateTransform attributeName="transform" dur="100s" fill="freeze" type="translate" additive="sum" ',
        'values="', newX.toString(), ' ', newY.toString(), ';'));

      for (uint8 j = 0; j < 100; j++) {
        newX = newPos(speedX, 1, newX);
        newY = newPos(speedY, 1, newY);

        smileSVG = string(abi.encodePacked(
          smileSVG,
          newX.toString(), ' ', newY.toString(), ';'));
      }

    smileSVG = string(abi.encodePacked(
      smileSVG,
        '"/>',
        '<animateTransform attributeName="transform" type="scale" additive="sum" values="0.3 0.3"/>',
        smile.renderTokenById(smileById[_id][i]),
        '</g>'));
    }

    return smileSVG;
  }

  function newPos(int8 speed, uint16 blocksTraveled, uint8 initPos) internal pure returns (uint8) {
      uint16 traveled;
      uint16 start;

      if (speed >= 0) {
        // console.log("speed", uint8(speed).toString());
        traveled = uint16((blocksTraveled * uint8(speed)) % 256);
        start = (initPos + traveled) % 256;
        // console.log("start", start.toString());
        // console.log("end", end.toString());
        return uint8(start);
      } else {
        // console.log("speed", uint8(-speed).toString());
        traveled = uint16((blocksTraveled * uint8(-speed)) % 256);
        start = (255 - traveled + initPos)%256;

        // console.log("start", start.toString());
        // console.log("end", end.toString());
        return uint8(start);
      }
  }

  // https://github.com/GNSPS/solidity-bytes-utils/blob/master/contracts/BytesLib.sol#L374
  function toUint256(bytes memory _bytes) internal pure returns (uint256) {
        require(_bytes.length >= 32, "toUint256_outOfBounds");
        uint256 tempUint;

        assembly {
            tempUint := mload(add(_bytes, 0x20))
        }

        return tempUint;
  }

  mapping(uint256 => uint8) x;
  mapping(uint256 => uint8) y;

  mapping(uint256 => uint256) blockAdded;

  // to receive ERC721 tokens
  function onERC721Received(
      address operator,
      address from,
      uint256 smileTokenId,
      bytes calldata happiIdData) external override returns (bytes4) {

      uint256 happiId = toUint256(happiIdData);
      require(ownerOf(happiId) == from, "you can only add smiles to your own happi.");
      require(smileById[happiId].length < 256, "Excess joy! Cant take anymore.");

      smileById[happiId].push(smileTokenId);

      bytes32 randish = keccak256(abi.encodePacked( blockhash(block.number-1), from, address(this), smileTokenId, happiIdData  ));
      x[smileTokenId] = uint8(randish[0]);
      y[smileTokenId] = uint8(randish[1]);
      blockAdded[smileTokenId] = block.number;

      return this.onERC721Received.selector;
    }
}