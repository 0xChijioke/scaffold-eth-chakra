pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

interface IERC20 {

  event Transfer(address indexed from, address indexed to, uint amount);
  event Approval(address indexed owner, address indexed spender, uint amount);

  function totalSupply() external view returns (uint);
  function balanceOf(address account) external view returns (uint);
  function transfer(address recipient, uint amount) external returns (bool);
  function allowance(address owner, address spender) external view returns (uint);
  function approve(address spender, uint amount) external returns (bool);
  function transferFrom(address spender, address recipient, uint amount) external returns (bool);
}

contract StakingRewards {
  IERC20 public immutable stakingToken;
  IERC20 public immutable rewardToken;

  address public owner;

  uint public duration;
  uint public finishedAt;
  uint public updatedAt;
  uint public rewardRate;
  uint public rewardPerTokenStored;
  mapping(address => uint) public userRewardPerTokenStored;
  mapping(address => uint) public rewards;

  uint public totalSupply;
  mapping(address => uint) public balanceOf;

  modifier onlyOwner() {
    require(msg.sender == owner, "Not the owner!");
    _;
  }

  modifier updateReward(address _account) {
    rewardPerTokenStored = rewardPerToken();
    updatedAt = lastTimeRewardApplicable();
    
    if (_account != address(0)) {
      rewards[_account] = earned(_account);
      userRewardPerTokenStored[_account] = rewardPerTokenStored;
    }
    _;
  }

  constructor(address _stakingToken, address _rewardToken) {
    owner = msg.sender;
    stakingToken = IERC20(_stakingToken);
    rewardToken = IERC20(_rewardToken);
  }


  function setRewardsDuration(uint _duration) external onlyOwner {
    require(finishedAt < block.timestamp, "Reward duration not finished");
    duration = _duration;
  }

  function notifyRewardAmount(uint _amount) external onlyOwner updateReward(address(0)) {
    if (block.timestamp > finishedAt){
      rewardRate = _amount;
    } else {
      uint remainingRewards = rewardRate * (finishedAt - block.timestamp);
      rewardRate = (remainingRewards + _amount) / duration;

    }
      require(rewardRate > 0, "RewardRate = 0");
      require(rewardRate * duration <= rewardToken.balanceOf(address(this)));

      finishedAt = duration + block.timestamp;
      updatedAt = block.timestamp;
  }


  function stake(uint _amount) external updateReward(msg.sender){
    require(_amount > 0, "Amount = 0");
    stakingToken.transferFrom(msg.sender, address(this), _amount);
    balanceOf[msg.sender] = _amount;
    totalSupply += _amount;
  }

  function withdraw(uint _amount) external updateReward(msg.sender){
    require(_amount > 0, "Amount = 0");
    balanceOf[msg.sender] -= _amount;
    totalSupply -= _amount;
    stakingToken.transfer(msg.sender, _amount);
  }

  function lastTimeRewardApplicable() public view returns (uint) {
    min(block.timestamp, finishedAt);
  }

  function rewardPerToken() public view returns (uint) {
    if (totalSupply == 0) {
      return rewardPerTokenStored;
    }
    return rewardPerTokenStored + (rewardRate * (lastTimeRewardApplicable() - updatedAt) * 1e18) / totalSupply;
  }

  function earned(address _account) public view returns (uint) {
    balanceOf[_account] * ((rewardPerToken() - userRewardPerTokenStored[_account]) / 1e18) + rewards[_account];
  }

  function getReward() external {}

  function min(uint x, uint y) private pure returns (uint) {
    return x <= y ? x : y;
  }

}