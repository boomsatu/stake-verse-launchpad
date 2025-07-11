import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, TrendingUp, Lock, Wallet } from "lucide-react";
import { useAccount } from "wagmi";
import { toast } from "@/hooks/use-toast";

type StakeType = "flexible" | "long";

interface StakeOption {
  type: StakeType;
  duration: string;
  apy: string;
  minAmount: string;
  description: string;
  lockPeriod?: string;
}

export const Stake = () => {
  const [selectedOption, setSelectedOption] = useState<StakeType>("flexible");
  const [amount, setAmount] = useState("");
  const { address, isConnected } = useAccount();

  const stakeOptions: Record<StakeType, StakeOption> = {
    flexible: {
      type: "flexible",
      duration: "No lock period",
      apy: "8.5%",
      minAmount: "100",
      description: "Withdraw anytime with no penalties. Perfect for users who want liquidity."
    },
    long: {
      type: "long",
      duration: "12 months",
      apy: "18.2%",
      minAmount: "1000",
      description: "Higher rewards for long-term commitment. Funds locked for 12 months.",
      lockPeriod: "365 days"
    }
  };

  const currentOption = stakeOptions[selectedOption];

  const handleStake = () => {
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

    // Here you would integrate with your smart contract
    toast({
      title: "Stake submitted",
      description: `Successfully staked ${amount} tokens in ${selectedOption} pool.`,
    });
  };

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Stake Your <span className="bg-gradient-primary bg-clip-text text-transparent">Tokens</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose your preferred staking option and start earning rewards
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Staking Options */}
          <div className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Staking Options
                </CardTitle>
                <CardDescription>
                  Select your preferred staking strategy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="stake-type">Staking Type</Label>
                  <Select value={selectedOption} onValueChange={(value: StakeType) => setSelectedOption(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staking option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flexible">
                        <div className="flex items-center justify-between w-full">
                          <span>Flexible Staking</span>
                          <Badge variant="secondary" className="ml-2">8.5% APY</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="long">
                        <div className="flex items-center justify-between w-full">
                          <span>Long-term Staking</span>
                          <Badge variant="default" className="ml-2">18.2% APY</Badge>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Duration:</span>
                    <span className="text-sm text-muted-foreground">{currentOption.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">APY:</span>
                    <span className="text-sm font-bold text-primary">{currentOption.apy}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Min Amount:</span>
                    <span className="text-sm text-muted-foreground">{currentOption.minAmount} tokens</span>
                  </div>
                  {currentOption.lockPeriod && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Lock Period:</span>
                      <span className="text-sm text-muted-foreground">{currentOption.lockPeriod}</span>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {currentOption.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-primary">24h</div>
                  <div className="text-sm text-muted-foreground">Reward Cycle</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-4 text-center">
                  <Lock className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-primary">$2.4B</div>
                  <div className="text-sm text-muted-foreground">Total Staked</div>
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
                  Stake Tokens
                </CardTitle>
                <CardDescription>
                  Enter the amount you want to stake
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
                    <span>Balance: 0 TOKEN</span>
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-primary">
                      Max
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Staking Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Staking Amount:</span>
                      <span>{amount || "0"} TOKEN</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Annual Rewards:</span>
                      <span className="text-primary font-medium">
                        {amount ? (parseFloat(amount) * parseFloat(currentOption.apy) / 100).toFixed(2) : "0"} TOKEN
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pool Type:</span>
                      <Badge variant={selectedOption === "flexible" ? "secondary" : "default"}>
                        {selectedOption === "flexible" ? "Flexible" : "Long-term"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleStake}
                  variant="gradient" 
                  size="lg" 
                  className="w-full"
                  disabled={!isConnected || !amount}
                >
                  {!isConnected ? "Connect Wallet to Stake" : "Stake Tokens"}
                </Button>

                {selectedOption === "long" && (
                  <div className="p-3 bg-accent/50 rounded-lg border border-border/50">
                    <p className="text-sm text-muted-foreground">
                      ⚠️ Long-term staking locks your tokens for 12 months. Early withdrawal is not available.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Stakes */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle>Your Stakes</CardTitle>
                <CardDescription>
                  Manage your existing stakes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  {!isConnected ? "Connect wallet to view stakes" : "No active stakes found"}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};