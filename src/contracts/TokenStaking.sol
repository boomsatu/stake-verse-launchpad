// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TokenStaking
 * @dev A comprehensive staking contract supporting flexible and fixed-term staking
 * @author TokenDApp Team
 */
contract TokenStaking is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    // Staking token
    IERC20 public immutable stakingToken;
    
    // Reward token (can be same as staking token)
    IERC20 public immutable rewardToken;

    // Staking pool types
    enum PoolType { 
        FLEXIBLE, 
        FIXED_3_MONTHS, 
        FIXED_6_MONTHS, 
        FIXED_9_MONTHS, 
        FIXED_12_MONTHS, 
        FIXED_24_MONTHS 
    }

    // Staking pool configuration
    struct Pool {
        uint256 apy;                // Annual Percentage Yield (in basis points, 1000 = 10%)
        uint256 minStakeAmount;     // Minimum stake amount
        uint256 lockPeriod;         // Lock period in seconds (0 for flexible)
        uint256 totalStaked;        // Total amount staked in this pool
        uint256 bonusMultiplier;    // Bonus multiplier in basis points (1000 = 10% bonus)
        bool active;                // Pool status
    }

    // User stake information
    struct Stake {
        uint256 amount;             // Staked amount
        uint256 startTime;          // Stake start timestamp
        uint256 lastRewardTime;     // Last reward calculation time
        uint256 accumulatedRewards; // Accumulated but unclaimed rewards
        uint256 lastBonusClaim;     // Last bonus claim time for flexible staking
        PoolType poolType;          // Pool type
        bool active;                // Stake status
    }

    // State variables
    mapping(PoolType => Pool) public pools;
    mapping(address => Stake[]) public userStakes;
    mapping(address => uint256) public userTotalStaked;
    
    uint256 public totalRewardsDistributed;
    uint256 public emergencyWithdrawFee = 500; // 5% fee for emergency withdrawal (basis points)
    
    // Events
    event Staked(address indexed user, uint256 amount, PoolType poolType, uint256 stakeIndex);
    event Unstaked(address indexed user, uint256 amount, uint256 rewards, uint256 stakeIndex);
    event RewardsClaimed(address indexed user, uint256 rewards);
    event EmergencyWithdrawn(address indexed user, uint256 amount, uint256 fee, uint256 stakeIndex);
    event PoolUpdated(PoolType poolType, uint256 apy, uint256 minStakeAmount);

    constructor(
        address _stakingToken,
        address _rewardToken
    ) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        
        // Initialize pools
        pools[PoolType.FLEXIBLE] = Pool({
            apy: 850,           // 8.5% APY
            minStakeAmount: 100 * 10**18,  // 100 tokens
            lockPeriod: 0,      // No lock period
            totalStaked: 0,
            bonusMultiplier: 50, // 0.5% daily bonus for 24h+ stakes
            active: true
        });
        
        pools[PoolType.FIXED_3_MONTHS] = Pool({
            apy: 1200,          // 12% APY
            minStakeAmount: 500 * 10**18, // 500 tokens
            lockPeriod: 90 days,
            totalStaked: 0,
            bonusMultiplier: 100, // 1% bonus
            active: true
        });
        
        pools[PoolType.FIXED_6_MONTHS] = Pool({
            apy: 1500,          // 15% APY
            minStakeAmount: 750 * 10**18, // 750 tokens
            lockPeriod: 180 days,
            totalStaked: 0,
            bonusMultiplier: 200, // 2% bonus
            active: true
        });
        
        pools[PoolType.FIXED_9_MONTHS] = Pool({
            apy: 1750,          // 17.5% APY
            minStakeAmount: 1000 * 10**18, // 1000 tokens
            lockPeriod: 270 days,
            totalStaked: 0,
            bonusMultiplier: 300, // 3% bonus
            active: true
        });
        
        pools[PoolType.FIXED_12_MONTHS] = Pool({
            apy: 2000,          // 20% APY
            minStakeAmount: 1500 * 10**18, // 1500 tokens
            lockPeriod: 365 days,
            totalStaked: 0,
            bonusMultiplier: 500, // 5% bonus
            active: true
        });
        
        pools[PoolType.FIXED_24_MONTHS] = Pool({
            apy: 2500,          // 25% APY
            minStakeAmount: 2500 * 10**18, // 2500 tokens
            lockPeriod: 730 days,
            totalStaked: 0,
            bonusMultiplier: 1000, // 10% bonus
            active: true
        });
    }

    /**
     * @dev Stake tokens in specified pool
     * @param amount Amount to stake
     * @param poolType Pool type to stake in
     */
    function stake(uint256 amount, PoolType poolType) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(amount > 0, "Amount must be greater than 0");
        require(pools[poolType].active, "Pool is not active");
        require(amount >= pools[poolType].minStakeAmount, "Amount below minimum stake");

        // Transfer tokens from user
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        // Create new stake
        userStakes[msg.sender].push(Stake({
            amount: amount,
            startTime: block.timestamp,
            lastRewardTime: block.timestamp,
            accumulatedRewards: 0,
            lastBonusClaim: block.timestamp,
            poolType: poolType,
            active: true
        }));

        // Update state
        pools[poolType].totalStaked += amount;
        userTotalStaked[msg.sender] += amount;

        emit Staked(msg.sender, amount, poolType, userStakes[msg.sender].length - 1);
    }

    /**
     * @dev Unstake tokens and claim rewards
     * @param stakeIndex Index of stake to unstake
     */
    function unstake(uint256 stakeIndex) 
        external 
        nonReentrant 
    {
        require(stakeIndex < userStakes[msg.sender].length, "Invalid stake index");
        
        Stake storage userStake = userStakes[msg.sender][stakeIndex];
        require(userStake.active, "Stake is not active");
        
        Pool storage pool = pools[userStake.poolType];
        
        // Check lock period for fixed staking
        if (pool.lockPeriod > 0) {
            require(
                block.timestamp >= userStake.startTime + pool.lockPeriod,
                "Stake is still locked"
            );
        }

        // Calculate pending rewards
        uint256 rewards = calculatePendingRewards(msg.sender, stakeIndex);
        
        // Update state
        uint256 stakeAmount = userStake.amount;
        userStake.active = false;
        pool.totalStaked -= stakeAmount;
        userTotalStaked[msg.sender] -= stakeAmount;
        totalRewardsDistributed += rewards;

        // Transfer tokens back to user
        stakingToken.safeTransfer(msg.sender, stakeAmount);
        
        // Transfer rewards if any
        if (rewards > 0) {
            rewardToken.safeTransfer(msg.sender, rewards);
        }

        emit Unstaked(msg.sender, stakeAmount, rewards, stakeIndex);
    }

    /**
     * @dev Emergency unstake with penalty (for fixed staking only)
     * @param stakeIndex Index of stake to emergency unstake
     */
    function emergencyUnstake(uint256 stakeIndex) 
        external 
        nonReentrant 
    {
        require(stakeIndex < userStakes[msg.sender].length, "Invalid stake index");
        
        Stake storage userStake = userStakes[msg.sender][stakeIndex];
        require(userStake.active, "Stake is not active");
        
        Pool storage pool = pools[userStake.poolType];
        require(pool.lockPeriod > 0, "Use regular unstake for flexible pools");
        require(
            block.timestamp < userStake.startTime + pool.lockPeriod,
            "Lock period already ended, use regular unstake"
        );

        uint256 stakeAmount = userStake.amount;
        uint256 fee = (stakeAmount * emergencyWithdrawFee) / 10000;
        uint256 amountAfterFee = stakeAmount - fee;

        // Update state
        userStake.active = false;
        pool.totalStaked -= stakeAmount;
        userTotalStaked[msg.sender] -= stakeAmount;

        // Transfer tokens (minus fee) back to user
        stakingToken.safeTransfer(msg.sender, amountAfterFee);

        emit EmergencyWithdrawn(msg.sender, amountAfterFee, fee, stakeIndex);
    }

    /**
     * @dev Claim accumulated rewards without unstaking
     * @param stakeIndex Index of stake to claim rewards for
     */
    function claimRewards(uint256 stakeIndex) 
        external 
        nonReentrant 
    {
        require(stakeIndex < userStakes[msg.sender].length, "Invalid stake index");
        
        Stake storage userStake = userStakes[msg.sender][stakeIndex];
        require(userStake.active, "Stake is not active");

        uint256 rewards = calculatePendingRewards(msg.sender, stakeIndex);
        require(rewards > 0, "No rewards to claim");

        // Update reward tracking
        userStake.lastRewardTime = block.timestamp;
        userStake.accumulatedRewards = 0;
        totalRewardsDistributed += rewards;

        // Transfer rewards
        rewardToken.safeTransfer(msg.sender, rewards);

        emit RewardsClaimed(msg.sender, rewards);
    }

    /**
     * @dev Calculate pending rewards for a specific stake
     * @param user User address
     * @param stakeIndex Stake index
     * @return Pending rewards amount
     */
    function calculatePendingRewards(address user, uint256 stakeIndex) 
        public 
        view 
        returns (uint256) 
    {
        if (stakeIndex >= userStakes[user].length) return 0;
        
        Stake memory userStake = userStakes[user][stakeIndex];
        if (!userStake.active) return 0;

        Pool memory pool = pools[userStake.poolType];
        
        uint256 stakingDuration = block.timestamp - userStake.lastRewardTime;
        uint256 yearlyReward = (userStake.amount * pool.apy) / 10000;
        uint256 baseReward = (yearlyReward * stakingDuration) / 365 days;
        
        // Calculate bonus for flexible staking (24h bonus)
        uint256 bonusReward = 0;
        if (userStake.poolType == PoolType.FLEXIBLE) {
            uint256 timeSinceLastBonus = block.timestamp - userStake.lastBonusClaim;
            if (timeSinceLastBonus >= 24 hours) {
                uint256 bonusMultiplier = pool.bonusMultiplier;
                bonusReward = (userStake.amount * bonusMultiplier) / 10000;
            }
        } else {
            // Apply bonus multiplier for fixed staking
            bonusReward = (baseReward * pool.bonusMultiplier) / 10000;
        }
        
        return userStake.accumulatedRewards + baseReward + bonusReward;
    }
    
    /**
     * @dev Claim 24-hour bonus for flexible staking
     * @param stakeIndex Index of stake to claim bonus for
     */
    function claimFlexibleBonus(uint256 stakeIndex) 
        external 
        nonReentrant 
    {
        require(stakeIndex < userStakes[msg.sender].length, "Invalid stake index");
        
        Stake storage userStake = userStakes[msg.sender][stakeIndex];
        require(userStake.active, "Stake is not active");
        require(userStake.poolType == PoolType.FLEXIBLE, "Only for flexible staking");
        
        uint256 timeSinceLastBonus = block.timestamp - userStake.lastBonusClaim;
        require(timeSinceLastBonus >= 24 hours, "Bonus not available yet");
        
        Pool memory pool = pools[userStake.poolType];
        uint256 bonusAmount = (userStake.amount * pool.bonusMultiplier) / 10000;
        
        // Update last bonus claim time
        userStake.lastBonusClaim = block.timestamp;
        totalRewardsDistributed += bonusAmount;
        
        // Transfer bonus
        rewardToken.safeTransfer(msg.sender, bonusAmount);
        
        emit RewardsClaimed(msg.sender, bonusAmount);
    }

    /**
     * @dev Get user's total pending rewards across all stakes
     * @param user User address
     * @return Total pending rewards
     */
    function getTotalPendingRewards(address user) 
        external 
        view 
        returns (uint256) 
    {
        uint256 totalRewards = 0;
        uint256 stakesLength = userStakes[user].length;
        
        for (uint256 i = 0; i < stakesLength; i++) {
            totalRewards += calculatePendingRewards(user, i);
        }
        
        return totalRewards;
    }

    /**
     * @dev Get user's active stakes
     * @param user User address
     * @return Array of active stakes
     */
    function getUserActiveStakes(address user) 
        external 
        view 
        returns (Stake[] memory) 
    {
        uint256 stakesLength = userStakes[user].length;
        uint256 activeCount = 0;
        
        // Count active stakes
        for (uint256 i = 0; i < stakesLength; i++) {
            if (userStakes[user][i].active) {
                activeCount++;
            }
        }
        
        // Create array of active stakes
        Stake[] memory activeStakes = new Stake[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < stakesLength; i++) {
            if (userStakes[user][i].active) {
                activeStakes[currentIndex] = userStakes[user][i];
                currentIndex++;
            }
        }
        
        return activeStakes;
    }

    /**
     * @dev Get pool information
     * @param poolType Pool type
     * @return Pool information
     */
    function getPoolInfo(PoolType poolType) 
        external 
        view 
        returns (Pool memory) 
    {
        return pools[poolType];
    }

    // Admin functions
    function updatePool(
        PoolType poolType,
        uint256 apy,
        uint256 minStakeAmount
    ) external onlyOwner {
        pools[poolType].apy = apy;
        pools[poolType].minStakeAmount = minStakeAmount;
        
        emit PoolUpdated(poolType, apy, minStakeAmount);
    }

    function setPoolStatus(PoolType poolType, bool active) external onlyOwner {
        pools[poolType].active = active;
    }

    function setEmergencyWithdrawFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee cannot exceed 10%");
        emergencyWithdrawFee = _fee;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdrawRewards(uint256 amount) external onlyOwner {
        rewardToken.safeTransfer(owner(), amount);
    }
}