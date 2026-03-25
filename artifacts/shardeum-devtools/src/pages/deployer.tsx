import { useState } from "react";
import { useCompileContract, useDeployContract } from "@/hooks/use-shardeum";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, Code2, Loader2, Play, Rocket, AlertCircle } from "lucide-react";

const DEFAULT_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleStorage {
    uint256 private value;
    event ValueChanged(uint256 newValue);

    constructor(uint256 _initialValue) {
        value = _initialValue;
    }

    function setValue(uint256 _value) public {
        value = _value;
        emit ValueChanged(_value);
    }

    function getValue() public view returns (uint256) {
        return value;
    }
}`;

export default function Deployer() {
  const { toast } = useToast();
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const [contractName, setContractName] = useState("SimpleStorage");
  const [privateKey, setPrivateKey] = useState("");
  const [constructorArgs, setConstructorArgs] = useState('["100"]');
  
  const compileMutation = useCompileContract();
  const deployMutation = useDeployContract();

  const handleCompile = () => {
    if (!source || !contractName) {
      toast({ title: "Error", description: "Source and Contract Name required", variant: "destructive" });
      return;
    }
    compileMutation.mutate(
      { source, contractName },
      {
        onSuccess: () => {
          toast({ title: "Compiled Successfully", description: "ABI and Bytecode generated." });
        },
        onError: (err) => {
          toast({ title: "Compilation Failed", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  const handleDeploy = () => {
    if (!compileMutation.data) {
      toast({ title: "Error", description: "Please compile the contract first.", variant: "destructive" });
      return;
    }
    if (!privateKey) {
      toast({ title: "Error", description: "Private key required for deployment.", variant: "destructive" });
      return;
    }

    let parsedArgs = [];
    try {
      parsedArgs = JSON.parse(constructorArgs || "[]");
    } catch {
      toast({ title: "Error", description: "Constructor args must be valid JSON array.", variant: "destructive" });
      return;
    }

    deployMutation.mutate(
      {
        abi: compileMutation.data.abi,
        bytecode: compileMutation.data.bytecode,
        privateKey,
        constructorArgs: parsedArgs
      },
      {
        onSuccess: (data) => {
          toast({ title: "Deployed Successfully!", description: `Contract at ${data.contractAddress}` });
        },
        onError: (err) => {
          toast({ title: "Deployment Failed", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold font-mono flex items-center gap-3">
          <Code2 className="w-8 h-8 text-primary" />
          Contract Deployer
        </h1>
        <p className="text-muted-foreground mt-2">Write, compile, and deploy Solidity smart contracts directly to Shardeum.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[600px]">
        {/* Editor Pane */}
        <Card className="flex flex-col border-border/50">
          <CardHeader className="py-3 border-b border-border/50 bg-muted/20">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-2 text-muted-foreground">{contractName}.sol</span>
            </CardTitle>
          </CardHeader>
          <div className="flex-1 p-0 relative">
            <Textarea 
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full h-full min-h-[500px] resize-none font-mono text-sm border-0 focus-visible:ring-0 rounded-none bg-transparent text-foreground/90 p-4"
              spellCheck={false}
            />
          </div>
        </Card>

        {/* Action Pane */}
        <div className="space-y-6 overflow-y-auto pr-2 pb-2">
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">1. Configuration & Compile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Contract Name (Target)</Label>
                <Input 
                  value={contractName} 
                  onChange={(e) => setContractName(e.target.value)}
                  className="font-mono bg-background"
                />
              </div>
              <Button 
                onClick={handleCompile} 
                disabled={compileMutation.isPending}
                className="w-full font-mono bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
              >
                {compileMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                {compileMutation.isPending ? "Compiling..." : "Compile Source"}
              </Button>

              {compileMutation.isError && (
                <div className="p-3 bg-destructive/10 border border-destructive/50 text-destructive text-sm font-mono rounded-md flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="whitespace-pre-wrap">{compileMutation.error.message}</span>
                </div>
              )}

              {compileMutation.isSuccess && (
                <Accordion type="single" collapsible className="w-full border border-border/50 rounded-md bg-muted/10">
                  <AccordionItem value="abi" className="border-b-border/50 px-4">
                    <AccordionTrigger className="text-sm font-mono text-primary py-3 hover:no-underline">
                      <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> ABI Generated</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="bg-background p-3 rounded text-xs font-mono max-h-40 overflow-y-auto text-muted-foreground">
                        {JSON.stringify(compileMutation.data.abi, null, 2)}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </CardContent>
          </Card>

          <Card className={`border-border/50 transition-opacity duration-300 ${!compileMutation.isSuccess ? 'opacity-50 pointer-events-none' : ''}`}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex justify-between items-center">
                2. Deploy
                {compileMutation.isSuccess && <Badge variant="default" className="bg-primary text-primary-foreground">Ready</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Constructor Arguments (JSON Array)</Label>
                <Input 
                  value={constructorArgs} 
                  onChange={(e) => setConstructorArgs(e.target.value)}
                  placeholder='e.g. ["100", "Hello"]'
                  className="font-mono bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>Deployer Private Key</Label>
                <Input 
                  type="password"
                  value={privateKey} 
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="0x..."
                  className="font-mono bg-background"
                />
              </div>
              <Button 
                onClick={handleDeploy} 
                disabled={deployMutation.isPending || !compileMutation.isSuccess}
                className="w-full font-mono shadow-lg shadow-primary/20"
              >
                {deployMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
                {deployMutation.isPending ? "Deploying to Shardeum..." : "Deploy Contract"}
              </Button>

              {deployMutation.isSuccess && (
                <div className="mt-4 p-4 border border-primary/30 bg-primary/5 rounded-lg space-y-2">
                  <h4 className="font-bold text-primary font-mono mb-2">✅ Deployment Success</h4>
                  <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                    <span className="text-muted-foreground font-mono">Address:</span>
                    <span className="font-mono text-foreground break-all">{deployMutation.data.contractAddress}</span>
                    
                    <span className="text-muted-foreground font-mono">Tx Hash:</span>
                    <span className="font-mono text-foreground break-all text-xs">{deployMutation.data.transactionHash}</span>
                    
                    <span className="text-muted-foreground font-mono">Gas Used:</span>
                    <span className="font-mono text-foreground">{parseInt(deployMutation.data.gasUsed, 16).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
