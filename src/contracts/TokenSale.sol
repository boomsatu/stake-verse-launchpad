// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TokenSale
 * @dev A comprehensive token sale contract with referral system
 * @author TokenDApp Team
 */
contract TokenSale is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    // Token being sold
    IERC20 public immutable saleToken;
    
    // Payment tokens accepted (ETH and ERC20)
    mapping(address => bool) public acceptedPaymentTokens;
    mapping(address => uint256) public paymentTokenRates; // tokens per 1 payment token
    
    // Sale configuration
    uint256 public tokenPrice; // Price in wei per token (for ETH payments)
    uint256 public minimumPurchase; // Minimum tokens to purchase
    uint256 public maximumPurchase; // Maximum tokens per transaction
    uint256 public totalTokensSold;
    uint256 public totalTokensAvailable;
    
    // Referral system
    uint256 public referralBonus = 500; // 5% bonus for referrals (basis points)
    uint256 public referrerReward = 300; // 3% reward for referrers (basis points)
    
    mapping(address => address) public referrers; // buyer => referrer
    mapping(address => uint256) public referralEarnings; // referrer => total earnings
    mapping(address => uint256) public referralCount; // referrer => number of referrals
    
    // Purchase tracking
    mapping(address => uint256) public userPurchases;
    
    // Sale phases
    enum SalePhase { 
        PRESALE,    // Early investors
        PUBLIC,     // Public sale
        ENDED       // Sale ended
    }
    
    SalePhase public currentPhase = SalePhase.PRESALE;
    
    // Phase configurations
    mapping(SalePhase => uint256) public phaseTokenLimits;
    mapping(SalePhase => uint256) public phasePrices;
    mapping(SalePhase => uint256) public phaseTokensSold;
    
    // Events
    event TokensPurchased(
        address indexed buyer,
        address indexed referrer,
        uint256 amount,
        uint256 cost,
        address paymentToken,
        uint256 referralBonus
    );
    event ReferralRewardPaid(address indexed referrer, uint256 amount);
    event PhaseChanged(SalePhase newPhase);
    event PriceUpdated(uint256 newPrice);
    event ReferralRatesUpdated(uint256 referralBonus, uint256 referrerReward);

    constructor(
        address _saleToken,
        uint256 _initialPrice,
        uint256 _totalTokensAvailable
    ) {
        saleToken = IERC20(_saleToken);
        tokenPrice = _initialPrice;
        totalTokensAvailable = _totalTokensAvailable;
        minimumPurchase = 10 * 10**18; // 10 tokens minimum
        maximumPurchase = 10000 * 10**18; // 10,000 tokens maximum
        
        // Setup ETH as accepted payment
        acceptedPaymentTokens[address(0)] = true; // ETH represented as zero address
        paymentTokenRates[address(0)] = 1 ether / _initialPrice; // tokens per ETH
        
        // Initialize phase configurations
        phaseTokenLimits[SalePhase.PRESALE] = _totalTokensAvailable * 30 / 100; // 30% for presale
        phaseTokenLimits[SalePhase.PUBLIC] = _totalTokensAvailable * 70 / 100;  // 70% for public
        
        phasePrices[SalePhase.PRESALE] = _initialPrice * 80 / 100; // 20% discount for presale
        phasePrices[SalePhase.PUBLIC] = _initialPrice;
    }

    /**
     * @dev Buy tokens with ETH
     * @param referrer Address of the referrer (optional)
     */
    function buyTokensWithETH(address referrer) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        require(msg.value > 0, "Must send ETH");
        require(currentPhase != SalePhase.ENDED, "Sale has ended");
        
        uint256 currentPrice = phasePrices[currentPhase];
        uint256 tokenAmount = (msg.value * 10**18) / currentPrice;
        
        _processPurchase(msg.sender, tokenAmount, msg.value, address(0), referrer);
    }

    /**
     * @dev Buy tokens with ERC20 token
     * @param paymentToken Address of the payment token
     * @param paymentAmount Amount of payment tokens to spend
     * @param referrer Address of the referrer (optional)
     */
    function buyTokensWithToken(
        address paymentToken,
        uint256 paymentAmount,
        address referrer
    ) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(acceptedPaymentTokens[paymentToken], "Payment token not accepted");
        require(paymentAmount > 0, "Payment amount must be greater than 0");
        require(currentPhase != SalePhase.ENDED, "Sale has ended");
        
        uint256 tokenAmount = (paymentAmount * paymentTokenRates[paymentToken]) / 10**18;
        
        // Transfer payment token from buyer
        IERC20(paymentToken).safeTransferFrom(msg.sender, address(this), paymentAmount);
        
        _processPurchase(msg.sender, tokenAmount, paymentAmount, paymentToken, referrer);
    }

    /**
     * @dev Internal function to process purchase
     */
    function _processPurchase(
        address buyer,
        uint256 tokenAmount,
        uint256 cost,
        address paymentToken,
        address referrer
    ) internal {
        require(tokenAmount >= minimumPurchase, "Below minimum purchase");
        require(tokenAmount <= maximumPurchase, "Above maximum purchase");
        require(totalTokensSold + tokenAmount <= totalTokensAvailable, "Not enough tokens available");
        require(phaseTokensSold[currentPhase] + tokenAmount <= phaseTokenLimits[currentPhase], "Phase limit exceeded");
        
        // Set referrer if provided and valid
        if (referrer != address(0) && referrer != buyer && referrers[buyer] == address(0)) {
            referrers[buyer] = referrer;
        }
        
        uint256 finalTokenAmount = tokenAmount;
        uint256 bonusTokens = 0;
        address userReferrer = referrers[buyer];
        
        // Apply referral bonus
        if (userReferrer != address(0)) {
            bonusTokens = (tokenAmount * referralBonus) / 10000;
            finalTokenAmount += bonusTokens;
            
            // Pay referrer reward
            uint256 referrerRewardAmount = (cost * referrerReward) / 10000;
            referralEarnings[userReferrer] += referrerRewardAmount;
            referralCount[userReferrer]++;
            
            // Transfer referrer reward (in payment token or ETH)
            if (paymentToken == address(0)) {
                payable(userReferrer).transfer(referrerRewardAmount);
            } else {
                IERC20(paymentToken).safeTransfer(userReferrer, referrerRewardAmount);
            }
            
            emit ReferralRewardPaid(userReferrer, referrerRewardAmount);
        }
        
        // Update state
        totalTokensSold += finalTokenAmount;
        phaseTokensSold[currentPhase] += finalTokenAmount;
        userPurchases[buyer] += finalTokenAmount;
        
        // Transfer tokens to buyer
        saleToken.safeTransfer(buyer, finalTokenAmount);
        
        emit TokensPurchased(buyer, userReferrer, finalTokenAmount, cost, paymentToken, bonusTokens);
        
        // Check if phase should advance
        if (phaseTokensSold[currentPhase] >= phaseTokenLimits[currentPhase]) {
            _advancePhase();
        }
    }

    /**
     * @dev Advance to next sale phase
     */
    function _advancePhase() internal {
        if (currentPhase == SalePhase.PRESALE) {
            currentPhase = SalePhase.PUBLIC;
            emit PhaseChanged(SalePhase.PUBLIC);
        } else if (currentPhase == SalePhase.PUBLIC) {
            currentPhase = SalePhase.ENDED;
            emit PhaseChanged(SalePhase.ENDED);
        }
    }

    /**
     * @dev Get current token price
     */
    function getCurrentPrice() external view returns (uint256) {
        return phasePrices[currentPhase];
    }

    /**
     * @dev Get tokens available in current phase
     */
    function getTokensAvailableInPhase() external view returns (uint256) {
        return phaseTokenLimits[currentPhase] - phaseTokensSold[currentPhase];
    }

    /**
     * @dev Get user referral info
     */
    function getUserReferralInfo(address user) 
        external 
        view 
        returns (
            address referrer,
            uint256 earnings,
            uint256 referralsCount
        ) 
    {
        return (
            referrers[user],
            referralEarnings[user],
            referralCount[user]
        );
    }

    /**
     * @dev Calculate tokens for given payment amount
     */
    function calculateTokenAmount(uint256 paymentAmount, address paymentToken) 
        external 
        view 
        returns (uint256 tokenAmount, uint256 bonusTokens) 
    {
        if (paymentToken == address(0)) {
            // ETH payment
            uint256 currentPrice = phasePrices[currentPhase];
            tokenAmount = (paymentAmount * 10**18) / currentPrice;
        } else {
            // ERC20 payment
            require(acceptedPaymentTokens[paymentToken], "Payment token not accepted");
            tokenAmount = (paymentAmount * paymentTokenRates[paymentToken]) / 10**18;
        }
        
        bonusTokens = (tokenAmount * referralBonus) / 10000;
        return (tokenAmount, bonusTokens);
    }

    // Admin functions
    function addPaymentToken(address token, uint256 rate) external onlyOwner {
        acceptedPaymentTokens[token] = true;
        paymentTokenRates[token] = rate;
    }

    function removePaymentToken(address token) external onlyOwner {
        acceptedPaymentTokens[token] = false;
        paymentTokenRates[token] = 0;
    }

    function updateReferralRates(uint256 _referralBonus, uint256 _referrerReward) external onlyOwner {
        require(_referralBonus <= 1000, "Referral bonus too high"); // Max 10%
        require(_referrerReward <= 1000, "Referrer reward too high"); // Max 10%
        
        referralBonus = _referralBonus;
        referrerReward = _referrerReward;
        
        emit ReferralRatesUpdated(_referralBonus, _referrerReward);
    }

    function updatePhasePrice(SalePhase phase, uint256 newPrice) external onlyOwner {
        phasePrices[phase] = newPrice;
        emit PriceUpdated(newPrice);
    }

    function forceAdvancePhase() external onlyOwner {
        _advancePhase();
    }

    function withdrawFunds(address token) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(address(this).balance);
        } else {
            IERC20(token).safeTransfer(owner(), IERC20(token).balanceOf(address(this)));
        }
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Emergency function to withdraw unsold tokens
    function withdrawUnsoldTokens() external onlyOwner {
        require(currentPhase == SalePhase.ENDED, "Sale not ended");
        uint256 unsoldTokens = saleToken.balanceOf(address(this));
        saleToken.safeTransfer(owner(), unsoldTokens);
    }
}