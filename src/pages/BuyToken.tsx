import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  ShoppingCart, 
  Users, 
  Gift, 
  Copy,
  ExternalLink,
  Wallet,
  TrendingUp,
  Clock,
  Shield,
  Zap
} from "lucide-react";
import { useAccount } from "wagmi";
import { toast } from "@/hooks/use-toast";
import { useReferral } from "@/hooks/useReferral";
import { TOKEN_SALE_CONTRACT_ADDRESS } from "@/contracts/abi";

export const BuyToken = () => {
  const [ethAmount, setEthAmount] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [manualReferrer, setManualReferrer] = useState("");
  const { address, isConnected } = useAccount();
  const { referrer, hasReferrer, generateReferralLink, setReferrer } = useReferral();

  // Mock data - in real implementation, these would come from smart contract
  const [saleData, setSaleData] = useState({
    currentPhase: "PRESALE" as "PRESALE" | "PUBLIC" | "ENDED",
    currentPrice: "0.0001", // ETH per token
    totalSold: 1250000,
    totalAvailable: 10000000,
    phaseTokensAvailable: 2750000,
    referralBonus: 5, // 5%
    referrerReward: 3, // 3%
    minimumPurchase: 10,
    maximumPurchase: 10000
  });

  const progressPercentage = (saleData.totalSold / saleData.totalAvailable) * 100;
  const phaseProgress = ((saleData.totalAvailable * 0.3 - saleData.phaseTokensAvailable) / (saleData.totalAvailable * 0.3)) * 100;

  useEffect(() => {
    if (ethAmount) {
      const tokens = parseFloat(ethAmount) / parseFloat(saleData.currentPrice);
      setTokenAmount(tokens.toFixed(2));
    } else {
      setTokenAmount("");
    }
  }, [ethAmount, saleData.currentPrice]);

  const handleBuyTokens = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to buy tokens.",
        variant: "destructive"
      });
      return;
    }

    if (!ethAmount || parseFloat(ethAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid ETH amount.",
        variant: "destructive"
      });
      return;
    }

    const tokens = parseFloat(tokenAmount);
    if (tokens < saleData.minimumPurchase) {
      toast({
        title: "Below minimum purchase",
        description: `Minimum purchase is ${saleData.minimumPurchase} tokens.`,
        variant: "destructive"
      });
      return;
    }

    if (tokens > saleData.maximumPurchase) {
      toast({
        title: "Above maximum purchase",
        description: `Maximum purchase is ${saleData.maximumPurchase} tokens per transaction.`,
        variant: "destructive"
      });
      return;
    }

    const finalReferrer = referrer || (manualReferrer || "0x0000000000000000000000000000000000000000");

    // Smart contract integration would go here
    toast({
      title: "Purchase submitted",
      description: `Successfully purchased ${tokenAmount} tokens with ${ethAmount} ETH. ${hasReferrer ? `Referrer: ${finalReferrer.slice(0, 6)}...${finalReferrer.slice(-4)}` : ''}`,
    });

    setEthAmount("");
    setTokenAmount("");
  };

  const handleCopyReferralLink = () => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet required",
        description: "Connect your wallet to generate referral links.",
        variant: "destructive"
      });
      return;
    }

    const link = generateReferralLink(window.location.origin + "/buy", address);
    navigator.clipboard.writeText(link);
    toast({
      title: "Referral link copied!",
      description: "Share this link to earn referral rewards.",
    });
  };

  const handleSetManualReferrer = () => {
    if (manualReferrer) {
      setReferrer(manualReferrer);
      setShowReferralInput(false);
      toast({
        title: "Referrer set",
        description: `Referrer address saved: ${manualReferrer.slice(0, 6)}...${manualReferrer.slice(-4)}`,
      });
    }
  };

  const calculateBonus = () => {
    if (!tokenAmount || !hasReferrer) return "0";
    const bonus = parseFloat(tokenAmount) * (saleData.referralBonus / 100);
    return bonus.toFixed(2);
  };

  const getTotalTokens = () => {
    if (!tokenAmount) return "0";
    const base = parseFloat(tokenAmount);
    const bonus = hasReferrer ? base * (saleData.referralBonus / 100) : 0;
    return (base + bonus).toFixed(2);
  };

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Buy <span className="bg-gradient-primary bg-clip-text text-transparent">TOKEN</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join our token sale with referral rewards and exclusive bonuses
          </p>
        </div>

        {/* Sale Progress */}
        <div className="max-w-4xl mx-auto mb-8">
          <Card className="bg-gradient-primary text-primary-foreground">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">{saleData.currentPhase}</div>
                  <div className="text-primary-foreground/80">Current Phase</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">{saleData.currentPrice} ETH</div>
                  <div className="text-primary-foreground/80">Price per Token</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">{(saleData.totalSold / 1000000).toFixed(1)}M</div>
                  <div className="text-primary-foreground/80">Tokens Sold</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">{saleData.referralBonus}%</div>
                  <div className="text-primary-foreground/80">Referral Bonus</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{progressPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                
                <div className="flex justify-between text-sm">
                  <span>{saleData.currentPhase} Phase Progress</span>
                  <span>{phaseProgress.toFixed(1)}%</span>
                </div>
                <Progress value={phaseProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Purchase Form */}
            <div className="space-y-6">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    Purchase Tokens
                  </CardTitle>
                  <CardDescription>
                    Buy tokens with ETH and earn referral bonuses
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="ethAmount">ETH Amount</Label>
                    <div className="relative">
                      <Input
                        id="ethAmount"
                        type="number"
                        placeholder="0.0"
                        value={ethAmount}
                        onChange={(e) => setEthAmount(e.target.value)}
                        className="pr-16"
                        step="0.001"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        ETH
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Balance: 0.00 ETH</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-auto p-0 text-primary"
                      >
                        Max
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="tokenAmount">Tokens to Receive</Label>
                    <div className="relative">
                      <Input
                        id="tokenAmount"
                        type="number"
                        placeholder="0"
                        value={tokenAmount}
                        onChange={(e) => setTokenAmount(e.target.value)}
                        className="pr-16"
                        readOnly
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        TOKEN
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Referrer Section */}
                  <div className="space-y-4 p-4 bg-secondary/50 rounded-lg">
                    <h4 className="font-medium flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      Referral System
                    </h4>
                    
                    {hasReferrer ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Referrer:</span>
                          <Badge variant="secondary" className="font-mono">
                            {referrer?.slice(0, 6)}...{referrer?.slice(-4)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Bonus Tokens:</span>
                          <span className="text-primary font-bold">+{calculateBonus()} TOKEN</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          No referrer set. Add a referrer to get {saleData.referralBonus}% bonus tokens!
                        </p>
                        {!showReferralInput ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setShowReferralInput(true)}
                            className="w-full"
                          >
                            Add Referrer Address
                          </Button>
                        ) : (
                          <div className="space-y-2">
                            <Input
                              placeholder="0x..."
                              value={manualReferrer}
                              onChange={(e) => setManualReferrer(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={handleSetManualReferrer}
                                disabled={!manualReferrer}
                                className="flex-1"
                              >
                                Set Referrer
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setShowReferralInput(false)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Purchase Summary */}
                  <div className="space-y-4 p-4 bg-secondary/50 rounded-lg">
                    <h4 className="font-medium">Purchase Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Base Tokens:</span>
                        <span className="font-mono">{tokenAmount || "0"} TOKEN</span>
                      </div>
                      {hasReferrer && (
                        <div className="flex justify-between">
                          <span>Referral Bonus ({saleData.referralBonus}%):</span>
                          <span className="text-primary font-mono">+{calculateBonus()} TOKEN</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span>Total Tokens:</span>
                        <span className="text-primary font-mono">{getTotalTokens()} TOKEN</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cost:</span>
                        <span className="font-mono">{ethAmount || "0"} ETH</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleBuyTokens}
                    variant="gradient" 
                    size="lg" 
                    className="w-full"
                    disabled={!isConnected || !ethAmount}
                  >
                    {!isConnected ? "Connect Wallet to Buy" : "Buy Tokens"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Referral & Info */}
            <div className="space-y-6">
              {/* Referral Earnings */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Referral Program
                  </CardTitle>
                  <CardDescription>
                    Earn rewards by referring friends
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-secondary/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">0</div>
                      <div className="text-sm text-muted-foreground">Referrals</div>
                    </div>
                    <div className="p-3 bg-secondary/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">0.0</div>
                      <div className="text-sm text-muted-foreground">ETH Earned</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">How it works:</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span>Share your referral link</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span>Friends get {saleData.referralBonus}% bonus tokens</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span>You earn {saleData.referrerReward}% in ETH</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleCopyReferralLink}
                    variant="outline" 
                    className="w-full"
                    disabled={!isConnected}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Referral Link
                  </Button>
                </CardContent>
              </Card>

              {/* Sale Features */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Sale Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Instant Delivery</div>
                        <div className="text-sm text-muted-foreground">Tokens sent immediately</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Presale Pricing</div>
                        <div className="text-sm text-muted-foreground">20% discount from public price</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Limited Time</div>
                        <div className="text-sm text-muted-foreground">Presale ends when sold out</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Wallet className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Multiple Payments</div>
                        <div className="text-sm text-muted-foreground">ETH and ERC20 tokens accepted</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contract Info */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle>Contract Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm font-medium mb-1">Token Sale Contract</div>
                    <div className="p-2 bg-secondary/50 rounded text-xs font-mono break-all">
                      {TOKEN_SALE_CONTRACT_ADDRESS}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a 
                      href={`https://sepolia.etherscan.io/address/${TOKEN_SALE_CONTRACT_ADDRESS}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View on Etherscan
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};