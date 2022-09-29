pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

interface IERC165 {
  function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

interface IERC721 is IERC165 {
    
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);

    
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    
    function balanceOf(address owner) external view returns (uint256 balance);

    
    function ownerOf(uint256 tokenId) external view returns (address owner);


  
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;

    
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;

   
    function approve(address to, uint256 tokenId) external;

   
    function setApprovalForAll(address operator, bool _approved) external;

   
    function getApproved(uint256 tokenId) external view returns (address operator);

    
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

interface IERC721Receiver {
  function onERC721Received(
    address operator,
    address from,
    uint tokenId,
    bytes calldata data
  ) external returns (bytes4);
}

contract ERC721 is IERC721 {
  mapping(uint => address) internal _ownerOf;
  mapping(address => uint) internal _balanceOf;
  mapping(uint => address) internal _approvals;
  mapping(address => mapping(address => bool)) public isApprovedForAll;

  function supportsInterface(bytes4 interfaceId) external view returns (bool){
    return interfaceId == type(IERC721).interfaceId || interfaceId == type(IERC165).interfaceId;
  }


  function ownerOf(uint tokenId) external view returns (address owner){
    owner = _ownerOf[tokenId];
    require(owner != address(0), "Owner is zero address");
  }

  function balanceOf(address owner) external view returns (uint balance){
    require(owner != address(0), "Add a vaild owner");
    return _balanceOf[owner];
  }

  function setApprovalForAll(address operator, bool _approved) external {
    isApprovedForAll[msg.sender][operator] = _approved;
    emit ApprovalForAll(msg.sender, operator, _approved);
  }

  function approve(address to, uint tokenId) external {
    address owner = _ownerOf[tokenId];
    require(
      msg.sender == owner || isApprovedForAll[owner][msg.sender],
      "Not Authorized"
    );
   _approvals[tokenId] = to;
   emit Approval(owner, to, tokenId);
  }

  function getApproved(uint tokenId) external view returns (address operator) {
    require(_ownerOf[tokenId] != address(0), "This token does not exist");
    return _approvals[tokenId];
  }

  function _isApprovedOrOwner(
    address owner,
    address spender,
    uint tokenId
  ) internal view returns (bool){
    return (
      spender == owner ||
      isApprovedForAll[owner][spender] ||
      spender == _approvals[tokenId]
    );
  }

  function transferFrom(
    address from,
    address to,
    uint tokenId
  ) public {
    require(from == _ownerOf[tokenId], "Not the owner");
    require(to != address(0), "To is zero address");
    require(_isApprovedOrOwner(from, msg.sender, tokenId), "Spender is not approved");
    _balanceOf[from]--;
    _balanceOf[to]++;

    _ownerOf[tokenId] = to;
    delete _approvals[tokenId];
    emit Transfer(from, to, tokenId);
  }

  function safeTransferFrom(address from, address to, uint tokenId) external {
    transferFrom(from, to, tokenId);

    require(
      to.code.length == 0 ||
      IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, "") ==
      IERC721Receiver.onERC721Received.selector,
      "Unsafe Receiver"
    );
  }

  function _mint(address to, uint tokenId) internal {
    require(to != address(0), "To is a zero address");
    require(_ownerOf[tokenId] == address(0), "Token exists");
    _balanceOf[to]++;
    _ownerOf[tokenId] = to;
    emit Transfer(address(0), to, tokenId);
  }

  function _burn(uint tokenId) internal {
    address owner = _ownerOf[tokenId];
    require(owner != address(0), "Token does not exist");

    _balanceOf[owner]--;
    delete _ownerOf[tokenId];
    delete _approvals[tokenId];

    emit Transfer(owner, address(0), tokenId);
  }

}

contract YourContract is ERC721 {
  function mint(address to, uint tokenId) external {
    _mint(to, tokenId);
  }

  function burn(uint tokenId) external {
    require(msg.sender == _ownerOf[tokenId], "Not the owner");
    _burn(tokenId);
  }
}
