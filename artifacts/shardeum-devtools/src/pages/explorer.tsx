import { useState } from "react";
import { useTransaction } from "@/hooks/use-shardeum";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Hash, ArrowRight, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export default function Explorer() {
  const [searchInput, setSearchInput] = useState("");
  const [activeHash, setActiveHash] = useState<string | undefined>(undefined);

  const { data: tx, isLoading, isError, error } = useTransaction(activeHash);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const val = searchInput.trim();
    if (val.length === 66 && val.startsWith('0x')) {
      setActiveHash(val);
    } else {
      alert("Please enter a valid 66-character transaction hash starting with 0x");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4 ring-1 ring-primary/30">
          <Search className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold font-mono tracking-tight">Transaction Explorer</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Deep dive into Shardeum transactions. Inspect gas usage, internal statuses, and payload data.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by Txn Hash (0x...)" 
            className="pl-12 h-14 text-lg font-mono bg-card border-border shadow-lg focus-visible:ring-primary/50"
          />
        </div>
        <Button type="submit" size="lg" className="h-14 px-8 font-bold font-mono">
          Search
        </Button>
      </form>

      {isLoading && (
        <div className="p-12 text-center text-primary font-mono animate-pulse">
          Querying the network...
        </div>
      )}

      {isError && (
        <div className="p-6 bg-destructive/10 border border-destructive/30 rounded-lg text-center font-mono text-destructive">
          {error.message || "Transaction not found on this network."}
        </div>
      )}

      {tx && (
        <Card className="border-border/50 shadow-xl overflow-hidden fade-in-up">
          <CardHeader className="bg-muted/10 border-b border-border/50 pb-6">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg font-mono flex items-center gap-2 mb-2">
                  Transaction Details
                </CardTitle>
                <div className="text-sm font-mono text-muted-foreground break-all bg-background px-3 py-1.5 rounded border border-border inline-block">
                  {tx.hash}
                </div>
              </div>
              <Badge variant="outline" className={`px-3 py-1 text-sm border ${tx.status === '0x1' || tx.status === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
                {tx.status === '0x1' || tx.status === 'success' ? (
                  <><CheckCircle2 className="w-4 h-4 mr-1.5 inline" /> Success</>
                ) : (
                  <><XCircle className="w-4 h-4 mr-1.5 inline" /> Failed</>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <dl className="divide-y divide-border/30">
              <div className="px-6 py-4 grid grid-cols-[200px_1fr] gap-4 hover:bg-muted/20 transition-colors">
                <dt className="text-sm font-medium text-muted-foreground flex items-center"><ArrowRight className="w-4 h-4 mr-2" /> From</dt>
                <dd className="font-mono text-sm text-primary break-all">{tx.from}</dd>
              </div>
              <div className="px-6 py-4 grid grid-cols-[200px_1fr] gap-4 hover:bg-muted/20 transition-colors">
                <dt className="text-sm font-medium text-muted-foreground flex items-center"><ArrowRight className="w-4 h-4 mr-2" /> To</dt>
                <dd className="font-mono text-sm text-primary break-all">{tx.to || <span className="text-muted-foreground">Contract Creation</span>}</dd>
              </div>
              <div className="px-6 py-4 grid grid-cols-[200px_1fr] gap-4 hover:bg-muted/20 transition-colors">
                <dt className="text-sm font-medium text-muted-foreground">Value</dt>
                <dd className="font-mono text-sm font-bold">{tx.value} <span className="text-muted-foreground font-normal">SHM</span></dd>
              </div>
              <div className="px-6 py-4 grid grid-cols-[200px_1fr] gap-4 hover:bg-muted/20 transition-colors">
                <dt className="text-sm font-medium text-muted-foreground">Block Number</dt>
                <dd className="font-mono text-sm">
                  <Badge variant="secondary" className="font-mono">{tx.blockNumber}</Badge>
                </dd>
              </div>
              <div className="px-6 py-4 grid grid-cols-[200px_1fr] gap-4 hover:bg-muted/20 transition-colors">
                <dt className="text-sm font-medium text-muted-foreground flex items-center"><Clock className="w-4 h-4 mr-2" /> Timestamp</dt>
                <dd className="font-mono text-sm">{tx.timestamp ? format(new Date(tx.timestamp * 1000), 'PPpp') : 'Unknown'}</dd>
              </div>
              <div className="px-6 py-4 grid grid-cols-[200px_1fr] gap-4 hover:bg-muted/20 transition-colors">
                <dt className="text-sm font-medium text-muted-foreground">Gas Used / Limit</dt>
                <dd className="font-mono text-sm text-muted-foreground">
                  <span className="text-foreground">{parseInt(tx.gasUsed, 16).toLocaleString()}</span> 
                  <span className="mx-2">/</span> 
                  {parseInt(tx.gasLimit, 16).toLocaleString()}
                </dd>
              </div>
              <div className="px-6 py-4 grid grid-cols-[200px_1fr] gap-4 hover:bg-muted/20 transition-colors">
                <dt className="text-sm font-medium text-muted-foreground">Input Data</dt>
                <dd className="font-mono text-xs text-muted-foreground bg-black/40 p-3 rounded-md border border-border/50 max-h-40 overflow-y-auto break-all">
                  {tx.input === '0x' ? '0x (Empty)' : tx.input}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
