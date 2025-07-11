import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Lock, 
  Wallet, 
  DollarSign, 
  AlertTriangle,
  Zap,
  BarChart3,
  Code,
  FileText,
  ExternalLink
} from "lucide-react";
import { useAccount } from "wagmi";
import { toast } from "@/hooks/use-toast";
import { STAKING_CONTRACT_ADDRESS, TOKEN_CONTRACT_ADDRESS } from "@/contracts/abi";

type PoolType = 0 | 1; // 0: FLEXIBLE, 1: FIXED_12_MONTHS

interface StakeOption {
  type: PoolType;
  name: string;
  duration: string;
  apy: string;
  minAmount: string;
  description: string;
  lockPeriod?: string;
  features: string[];
}

export const Stake = () => {
  const [selectedOption, setSelectedOption] = useState<PoolType>(0);
  const [amount, setAmount] = useState("");
  const { address, isConnected } = useAccount();

  const stakeOptions: Record<PoolType, StakeOption> = {
    0: {
      type: 0,
      name: "Flexible Staking",
      duration: "No lock period",
      apy: "8.5%",
      minAmount: "100",
      description: "Withdraw anytime with no penalties. Perfect for users who want liquidity.",
      features: ["Instant withdrawal", "Daily rewards", "No lock period", "Lower gas fees"]
    },
    1: {
      type: 1,
      name: "Fixed-Term Staking",
      duration: "12 months",
      apy: "18.2%",
      minAmount: "1000",
      description: "Higher rewards for long-term commitment. Funds locked for 12 months.",
      lockPeriod: "365 days",
      features: ["Maximum rewards", "Compound interest", "Early withdrawal penalty", "Premium APY"]
    }
  };

  const currentOption = stakeOptions[selectedOption];

  const handleStake = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to stake tokens.",
        variant: "destructive"
      });
      return;
    }

    if (!amount || parseFloat(amount) < parseFloat(currentOption.minAmount)) {
      toast({
        title: "Invalid amount",
        description: `Minimum stake amount is ${currentOption.minAmount} tokens.`,
        variant: "destructive"
      });
      return;
    }

    // Smart contract integration would go here
    toast({
      title: "Stake submitted",
      description: `Successfully staked ${amount} tokens in ${currentOption.name.toLowerCase()}.`,
    });
    
    setAmount("");
  };

  const calculateEstimatedRewards = () => {
    if (!amount) return "0";
    const yearly = parseFloat(amount) * parseFloat(currentOption.apy) / 100;
    return yearly.toFixed(2);
  };

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Professional <span className="bg-gradient-primary bg-clip-text text-transparent">Staking Protocol</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Advanced DeFi staking with real-time rewards calculation and comprehensive analytics
          </p>
        </div>

        {/* Rewards Summary */}
        {isConnected && (
          <div className="max-w-4xl mx-auto mb-8">
            <Card className="bg-gradient-primary text-primary-foreground">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">0.0000</div>
                    <div className="text-primary-foreground/80">Total Pending Rewards</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">0.00</div>
                    <div className="text-primary-foreground/80">Available Balance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">2.4M</div>
                    <div className="text-primary-foreground/80">Total Value Locked</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="stake" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stake">Stake Tokens</TabsTrigger>
            <TabsTrigger value="manage">Manage Stakes</TabsTrigger>
            <TabsTrigger value="contracts">Smart Contracts</TabsTrigger>
          </TabsList>

          <TabsContent value="stake" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pool Selection */}
              <div className="space-y-6">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Pool Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Pool Comparison */}
                    <div className="space-y-4">
                      {Object.values(stakeOptions).map((option) => (
                        <div
                          key={option.type}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedOption === option.type
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => setSelectedOption(option.type)}
                        >
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold">{option.name}</h3>
                            <Badge variant={option.type === 0 ? "secondary" : "default"}>
                              {option.apy} APY
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Duration:</span>
                              <span className="text-muted-foreground">{option.duration}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Min Amount:</span>
                              <span className="text-muted-foreground">{option.minAmount} TOKEN</span>
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="text-xs text-muted-foreground mb-2">Features:</div>
                            <div className="flex flex-wrap gap-1">
                              {option.features.map((feature, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Pool Statistics */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold text-primary">1.2M</div>
                      <div className="text-sm text-muted-foreground">Flexible Pool TVL</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="p-4 text-center">
                      <Lock className="h-8 w-8 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold text-primary">1.2M</div>
                      <div className="text-sm text-muted-foreground">Fixed Pool TVL</div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Staking Form */}
              <div className="space-y-6">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-primary" />
                      Stake {currentOption.name}
                    </CardTitle>
                    <CardDescription>
                      {currentOption.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="amount">Amount to Stake</Label>
                      <div className="relative">
                        <Input
                          id="amount"
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="pr-16"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          TOKEN
                        </div>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Balance: 0.00 TOKEN</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-auto p-0 text-primary"
                        >
                          Max
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Staking Preview */}
                    <div className="space-y-4 p-4 bg-secondary/50 rounded-lg">
                      <h4 className="font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Staking Preview
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Staking Amount:</span>
                          <span className="font-mono">{amount || "0"} TOKEN</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pool Type:</span>
                          <Badge variant={selectedOption === 0 ? "secondary" : "default"}>
                            {currentOption.name}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>APY:</span>
                          <span className="text-primary font-bold">{currentOption.apy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Est. Annual Rewards:</span>
                          <span className="text-primary font-mono">
                            {calculateEstimatedRewards()} TOKEN
                          </span>
                        </div>
                        {currentOption.lockPeriod && (
                          <div className="flex justify-between">
                            <span>Lock Period:</span>
                            <span className="text-muted-foreground">{currentOption.lockPeriod}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Button 
                        onClick={handleStake}
                        variant="gradient" 
                        size="lg" 
                        className="w-full"
                        disabled={!isConnected || !amount}
                      >
                        {!isConnected ? "Connect Wallet to Stake" : "Stake Tokens"}
                      </Button>
                    </div>

                    {selectedOption === 1 && (
                      <div className="p-3 bg-accent/50 rounded-lg border border-border/50">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                          <p className="text-sm text-muted-foreground">
                            Fixed-term staking locks your tokens for 12 months. Emergency withdrawal 
                            incurs a 5% penalty fee.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="manage" className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle>Your Active Stakes</CardTitle>
                <CardDescription>
                  Manage your existing stakes and claim rewards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  {!isConnected ? (
                    <div className="space-y-4">
                      <Wallet className="h-12 w-12 mx-auto opacity-50" />
                      <p>Connect your wallet to view and manage your stakes</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <BarChart3 className="h-12 w-12 mx-auto opacity-50" />
                      <p>No active stakes found</p>
                      <p className="text-sm">Start staking to see your positions here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-primary" />
                    Smart Contract Code
                  </CardTitle>
                  <CardDescription>
                    View the complete Solidity implementation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <div className="text-sm font-mono text-muted-foreground mb-2">TokenStaking.sol</div>
                    <div className="text-xs text-muted-foreground mb-4">
                      Comprehensive staking contract with flexible and fixed-term pools
                    </div>
                    <div className="space-y-2 text-xs">
                      <div>• Flexible & Fixed-term staking pools</div>
                      <div>• Real-time reward calculation</div>
                      <div>• Emergency withdrawal with penalty</div>
                      <div>• Owner controls & pausable</div>
                      <div>• ReentrancyGuard protection</div>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full" asChild>
                    <a href="/src/contracts/TokenStaking.sol" target="_blank" rel="noopener noreferrer">
                      <FileText className="mr-2 h-4 w-4" />
                      View Full Contract Code
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-primary" />
                    Contract ABI & Addresses
                  </CardTitle>
                  <CardDescription>
                    Integration details for developers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium mb-1">Staking Contract</div>
                      <div className="p-2 bg-secondary/50 rounded text-xs font-mono break-all">
                        {STAKING_CONTRACT_ADDRESS}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-1">Token Contract</div>
                      <div className="p-2 bg-secondary/50 rounded text-xs font-mono break-all">
                        {TOKEN_CONTRACT_ADDRESS}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Key Functions</div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div>• stake(amount, poolType)</div>
                      <div>• unstake(stakeIndex)</div>
                      <div>• claimRewards(stakeIndex)</div>
                      <div>• emergencyUnstake(stakeIndex)</div>
                      <div>• calculatePendingRewards(user, index)</div>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full" asChild>
                    <a href="/src/contracts/abi.ts" target="_blank" rel="noopener noreferrer">
                      <Code className="mr-2 h-4 w-4" />
                      View Complete ABI
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Contract Features */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle>Contract Features & Security</CardTitle>
                <CardDescription>
                  Built with industry-leading security practices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-secondary/50 rounded-lg">
                    <Lock className="h-8 w-8 text-primary mx-auto mb-2" />
                    <div className="font-medium">ReentrancyGuard</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Prevents reentrancy attacks
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-secondary/50 rounded-lg">
                    <AlertTriangle className="h-8 w-8 text-primary mx-auto mb-2" />
                    <div className="font-medium">Pausable</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Emergency pause functionality
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-secondary/50 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                    <div className="font-medium">Real-time Rewards</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Continuous reward calculation
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-secondary/50 rounded-lg">
                    <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
                    <div className="font-medium">Gas Optimized</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Efficient contract design
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};