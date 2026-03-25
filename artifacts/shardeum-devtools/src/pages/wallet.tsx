import { useState } from "react";
import { useAddressInfo } from "@/hooks/use-shardeum";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet as WalletIcon, Coins, Activity, FileCode } from "lucide-react";

export default function WalletChecker() {
  const [searchInput, setSearchInput] = useState("");
  const [activeAddress, setActiveAddress] = useState<string | undefined>(undefined);

  const { data: info, isLoading, isError, error } = useAddressInfo(activeAddress);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const val = searchInput.trim();
    if (val.length === 42 && val.startsWith('0x')) {
      setActiveAddress(val);
    } else {
      alert("Please enter a valid 42-character Ethereum address starting with 0x");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center justify-center p-3 bg-accent/10 rounded-full mb-4 ring-1 ring-accent/30">
          <WalletIcon className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-4xl font-bold font-mono tracking-tight">Address Inspector</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Check balances, nonce counts, and smart contract bytecode for any address on Shardeum.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <WalletIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Enter Address (0x...)" 
            className="pl-12 h-14 text-lg font-mono bg-card border-border shadow-lg focus-visible:ring-accent/50"
          />
        </div>
        <Button type="submit" size="lg" className="h-14 px-8 font-bold font-mono bg-accent text-accent-foreground hover:bg-accent/90">
          Inspect
        </Button>
      </form>

      {isLoading && (
        <div className="p-12 text-center text-accent font-mono animate-pulse">
          Fetching ledger data...
        </div>
      )}

      {isError && (
        <div className="p-6 bg-destructive/10 border border-destructive/30 rounded-lg text-center font-mono text-destructive">
          {error.message || "Failed to fetch address information."}
        </div>
      )}

      {info && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 fade-in-up">
          <Card className="col-span-1 md:col-span-3 border-border/50 bg-gradient-to-br from-card to-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inspected Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-mono tracking-tight break-all text-foreground">{info.address}</span>
                {info.isContract && (
                  <Badge variant="default" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    Smart Contract
                  </Badge>
                )}
                {!info.isContract && (
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    EOA
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-accent/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-500" />
                Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-foreground mb-1">
                {parseFloat(info.balanceSHM).toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                {info.balanceWei} Wei
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-accent/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                Transactions (Nonce)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-foreground">
                {info.transactionCount.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 md:col-span-3 border-border/50 mt-4">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileCode className="w-4 h-4 text-green-500" />
                Bytecode
              </CardTitle>
            </CardHeader>
            <CardContent>
              {info.isContract && info.code && info.code !== '0x' ? (
                <div className="bg-black/50 p-4 rounded-md border border-border/50 font-mono text-xs text-muted-foreground max-h-64 overflow-y-auto break-all">
                  {info.code}
                </div>
              ) : (
                <div className="text-center py-8 text-sm font-mono text-muted-foreground border border-dashed border-border/50 rounded-md">
                  No bytecode deployed at this address.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
