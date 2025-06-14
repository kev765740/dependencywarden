import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Copy, Gift, Users, Calendar, Crown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ReferralStats {
  referralCode: string | null;
  referralCount: number;
  referralRewardClaimed: boolean;
  referrals: Array<{
    id: string;
    email: string | null;
    createdAt: Date | null;
  }>;
}

export default function Referrals() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: referralData, isLoading } = useQuery({
    queryKey: ["/api/referrals"],
  });

  const referralStats = (referralData as any)?.referrals;

  const generateReferralLink = () => {
    if (!referralStats?.referralCode) return "";
    return `${window.location.origin}/?ref=${referralStats.referralCode}`;
  };

  const copyReferralLink = async () => {
    const link = generateReferralLink();
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy referral link",
        variant: "destructive",
      });
    }
  };

  const getReferralProgress = () => {
    const count = referralStats?.referralCount || 0;
    const target = 3;
    return {
      count,
      target,
      percentage: Math.min((count / target) * 100, 100),
      remaining: Math.max(target - count, 0),
    };
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const progress = getReferralProgress();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Referral Program</h1>
          <p className="text-muted-foreground">
            Invite friends and earn rewards when they join
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referralStats?.totalReferrals || 0}</div>
            <p className="text-xs text-muted-foreground">
              People you've referred
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress to Reward</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress.count}/{progress.target}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {progress.remaining > 0 
                ? `${progress.remaining} more referrals for Pro subscription`
                : "Reward earned!"
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reward Status</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {referralStats?.referralRewardClaimed ? (
                <Badge variant="secondary" className="text-sm">
                  <Crown className="h-3 w-3 mr-1" />
                  Claimed
                </Badge>
              ) : progress.count >= 3 ? (
                <Badge className="text-sm">
                  <Gift className="h-3 w-3 mr-1" />
                  Available
                </Badge>
              ) : (
                <Badge variant="outline" className="text-sm">
                  Pending
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {referralStats?.referralRewardClaimed 
                ? "1 month Pro subscription active"
                : progress.count >= 3
                ? "Free Pro subscription ready!"
                : "Refer 3 friends for free Pro"
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>
            Share this link with friends to track your referrals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={generateReferralLink()}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              onClick={copyReferralLink}
              variant="outline"
              className="shrink-0"
            >
              <Copy className="h-4 w-4 mr-2" />
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              How it works:
            </h4>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>• Share your referral link with friends</li>
              <li>• They sign up using your link</li>
              <li>• You earn credit for each successful referral</li>
              <li>• Get 3 referrals and unlock 1 month of Pro subscription for free!</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
          <CardDescription>
            People who joined using your referral link
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referralStats?.referrals && referralStats.referrals.length > 0 ? (
            <div className="space-y-4">
              {referralStats.referrals.map((referral, index) => (
                <div key={referral.id}>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {referral.email || `User ${index + 1}`}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Joined {referral.createdAt 
                            ? formatDistanceToNow(new Date(referral.createdAt), { addSuffix: true })
                            : "recently"
                          }
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">Verified</Badge>
                  </div>
                  {index < referralStats.referrals.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No referrals yet</h3>
              <p className="text-muted-foreground mb-4">
                Start sharing your referral link to earn rewards!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}