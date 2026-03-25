import { useNetworkStatus, useRecentBlocks } from "@/hooks/use-shardeum";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Box, Cpu, Globe, Server, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: network, isLoading: isNetLoading, isError: isNetError } = useNetworkStatus();
  const { data: blocksData, isLoading: isBlocksLoading } = useRecentBlocks();

  if (isNetLoading) {
    return <div className="flex h-full items-center justify-center font-mono animate-pulse text-primary">Loading network data...</div>;
  }

  if (isNetError || !network) {
    return (
      <div className="p-6 bg-destructive/10 border border-destructive rounded-lg text-destructive font-mono">
        <h3 className="font-bold mb-2">Error connecting to Shardeum Network</h3>
        <p>Please ensure the node is running and the RPC URL is reachable.</p>
      </div>
    );
  }

  const stats = [
    { title: "Block Height", value: network.blockNumber.toLocaleString(), icon: Box, color: "text-blue-400" },
    { title: "Gas Price", value: `${network.gasPrice} Gwei`, icon: Zap, color: "text-yellow-400" },
    { title: "Network", value: network.networkName, icon: Globe, color: "text-green-400" },
    { title: "Chain ID", value: network.chainId.toString(), icon: Cpu, color: "text-purple-400" },
    { title: "Active Peers", value: network.peerCount.toString(), icon: Server, color: "text-cyan-400" },
    { title: "Status", value: network.isConnected ? "Connected" : "Disconnected", icon: Activity, color: network.isConnected ? "text-primary" : "text-destructive" },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-mono text-foreground mb-2 flex items-center gap-3">
          Network Monitor
          <Badge variant="outline" className="border-primary/50 text-primary animate-pulse bg-primary/10">LIVE</Badge>
        </h1>
        <p className="text-muted-foreground">Real-time statistics for the Shardeum Sphinx Testnet.</p>
      </div>

      <motion.div 
        variants={container} 
        initial="hidden" 
        animate="show" 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {stats.map((stat, i) => (
          <motion.div key={i} variants={item}>
            <Card className="glass-panel overflow-hidden relative group hover:border-primary/50 transition-colors duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <stat.icon className={`w-16 h-16 ${stat.color}`} />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                  {stat.title === "Status" ? (
                    <span className={network.isConnected ? "text-primary" : "text-destructive"}>{stat.value}</span>
                  ) : (
                    stat.value
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold font-mono">Recent Blocks</h2>
        <Card className="border-border/50">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-mono">Block</th>
                  <th className="px-6 py-4 font-mono">Age</th>
                  <th className="px-6 py-4 font-mono">Txn Count</th>
                  <th className="px-6 py-4 font-mono">Gas Used</th>
                  <th className="px-6 py-4 font-mono">Hash</th>
                </tr>
              </thead>
              <tbody>
                {isBlocksLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground font-mono animate-pulse">
                      Syncing blocks...
                    </td>
                  </tr>
                ) : blocksData?.blocks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No recent blocks found.
                    </td>
                  </tr>
                ) : (
                  blocksData?.blocks.map((block) => (
                    <tr key={block.hash} className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-primary">#{block.number}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDistanceToNow(block.timestamp * 1000, { addSuffix: true })}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className="font-mono">{block.transactionCount}</Badge>
                      </td>
                      <td className="px-6 py-4 font-mono text-muted-foreground">
                        {parseInt(block.gasUsed, 16).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground truncate max-w-[200px]">
                        {block.hash}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
