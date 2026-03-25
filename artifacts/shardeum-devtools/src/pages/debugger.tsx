import { useState, useMemo } from "react";
import { useCallContract, useSendContract } from "@/hooks/use-shardeum";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { TerminalSquare, BookOpen, Edit3, KeyRound, Loader2 } from "lucide-react";

export default function Debugger() {
  const { toast } = useToast();
  const [address, setAddress] = useState("");
  const [abiStr, setAbiStr] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  
  // Dynamic form states per function: Record<functionName, string[]>
  const [inputs, setInputs] = useState<Record<string, string[]>>({});
  
  const callMutation = useCallContract();
  const sendMutation = useSendContract();

  const parsedAbi = useMemo(() => {
    if (!abiStr.trim()) return null;
    try {
      const parsed = JSON.parse(abiStr);
      if (!Array.isArray(parsed)) return null;
      return parsed.filter(item => item.type === "function");
    } catch {
      return null;
    }
  }, [abiStr]);

  const readFuncs = useMemo(() => parsedAbi?.filter(f => ['view', 'pure'].includes(f.stateMutability)) || [], [parsedAbi]);
  const writeFuncs = useMemo(() => parsedAbi?.filter(f => !['view', 'pure'].includes(f.stateMutability)) || [], [parsedAbi]);

  const handleInputChange = (funcName: string, index: number, value: string) => {
    setInputs(prev => {
      const newInputs = prev[funcName] ? [...prev[funcName]] : [];
      newInputs[index] = value;
      return { ...prev, [funcName]: newInputs };
    });
  };

  const executeCall = (func: any) => {
    if (!address) {
      toast({ title: "Error", description: "Contract address required", variant: "destructive" });
      return;
    }
    const args = inputs[func.name] || [];
    // Basic formatting for args
    const parsedArgs = args.map(arg => {
      if (arg === undefined) return "";
      if (arg.startsWith('[') || arg.startsWith('{')) {
        try { return JSON.parse(arg); } catch { return arg; }
      }
      return arg;
    });

    if (['view', 'pure'].includes(func.stateMutability)) {
      callMutation.mutate({
        contractAddress: address,
        abi: parsedAbi!,
        functionName: func.name,
        args: parsedArgs
      });
    } else {
      if (!privateKey) {
        toast({ title: "Error", description: "Private key required for write functions", variant: "destructive" });
        return;
      }
      sendMutation.mutate({
        contractAddress: address,
        abi: parsedAbi!,
        functionName: func.name,
        args: parsedArgs,
        privateKey
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-mono flex items-center gap-3">
          <TerminalSquare className="w-8 h-8 text-primary" />
          Contract Debugger
        </h1>
        <p className="text-muted-foreground mt-2">Interact with deployed smart contracts instantly by pasting the ABI.</p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Target Contract</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contract Address</Label>
              <Input 
                value={address} 
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x..." 
                className="font-mono bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-muted-foreground" />
                Private Key (Optional, for Write txs)
              </Label>
              <Input 
                type="password"
                value={privateKey} 
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="0x..." 
                className="font-mono bg-background"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Contract ABI (JSON Array)</Label>
            <Textarea 
              value={abiStr} 
              onChange={(e) => setAbiStr(e.target.value)}
              placeholder="[{ ... }]" 
              className="font-mono text-sm h-32 bg-background border-border/50 focus-visible:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

      {!parsedAbi && abiStr.trim().length > 0 && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md font-mono text-sm">
          Invalid ABI JSON format. Please paste a valid array of function definitions.
        </div>
      )}

      {parsedAbi && (
        <Tabs defaultValue="read" className="w-full">
          <TabsList className="w-full grid grid-cols-2 max-w-md bg-muted/50 border border-border/50">
            <TabsTrigger value="read" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono">
              <BookOpen className="w-4 h-4 mr-2" /> Read ({readFuncs.length})
            </TabsTrigger>
            <TabsTrigger value="write" className="data-[state=active]:bg-destructive/20 data-[state=active]:text-destructive font-mono">
              <Edit3 className="w-4 h-4 mr-2" /> Write ({writeFuncs.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="read" className="mt-6">
            {readFuncs.length === 0 ? (
              <p className="text-muted-foreground font-mono p-4 border border-dashed rounded text-center">No read functions found in ABI.</p>
            ) : (
              <Accordion type="multiple" className="space-y-3">
                {readFuncs.map((func) => (
                  <FunctionCard 
                    key={func.name} 
                    func={func} 
                    inputs={inputs[func.name] || []}
                    onInputChange={(idx, val) => handleInputChange(func.name, idx, val)}
                    onExecute={() => executeCall(func)}
                    isLoading={callMutation.isPending && callMutation.variables?.functionName === func.name}
                    result={callMutation.data?.functionName === func.name ? callMutation.data.result : null}
                    error={callMutation.error?.message}
                    isRead={true}
                  />
                ))}
              </Accordion>
            )}
          </TabsContent>

          <TabsContent value="write" className="mt-6">
             {writeFuncs.length === 0 ? (
              <p className="text-muted-foreground font-mono p-4 border border-dashed rounded text-center">No write functions found in ABI.</p>
            ) : (
              <Accordion type="multiple" className="space-y-3">
                {writeFuncs.map((func) => (
                  <FunctionCard 
                    key={func.name} 
                    func={func} 
                    inputs={inputs[func.name] || []}
                    onInputChange={(idx, val) => handleInputChange(func.name, idx, val)}
                    onExecute={() => executeCall(func)}
                    isLoading={sendMutation.isPending && sendMutation.variables?.functionName === func.name}
                    result={sendMutation.data?.status === 'success' && sendMutation.variables?.functionName === func.name ? `Tx Hash: ${sendMutation.data.transactionHash}` : null}
                    error={sendMutation.error?.message}
                    isRead={false}
                  />
                ))}
              </Accordion>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function FunctionCard({ func, inputs, onInputChange, onExecute, isLoading, result, error, isRead }: any) {
  return (
    <AccordionItem value={func.name} className="border border-border/50 rounded-lg bg-card/50 overflow-hidden px-1">
      <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/20">
        <div className="flex items-center gap-3 w-full">
          <span className="font-mono text-sm font-bold text-foreground">{func.name}</span>
          {func.inputs?.length > 0 && (
            <Badge variant="outline" className="font-mono text-[10px] ml-2 text-muted-foreground border-border">
              {func.inputs.length} args
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 border-t border-border/30 pt-4">
        <div className="space-y-4">
          {func.inputs?.map((input: any, idx: number) => (
            <div key={idx} className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-mono flex justify-between">
                <span>{input.name || `param${idx}`}</span>
                <span className="text-primary/70">{input.type}</span>
              </Label>
              <Input 
                value={inputs[idx] || ""}
                onChange={(e) => onInputChange(idx, e.target.value)}
                placeholder={`Value for ${input.type}`}
                className="font-mono text-sm h-9 bg-background/50 border-border"
              />
            </div>
          ))}

          <Button 
            onClick={onExecute} 
            disabled={isLoading}
            variant={isRead ? "secondary" : "default"}
            className={`w-full font-mono mt-2 ${!isRead ? "bg-destructive/20 text-destructive border border-destructive/50 hover:bg-destructive/30" : ""}`}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {!isLoading && (isRead ? <BookOpen className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />)}
            {isRead ? "Query" : "Transact"}
          </Button>

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm font-mono break-words">
              {error}
            </div>
          )}

          {result !== null && result !== undefined && (
            <div className="mt-4 p-4 bg-black/40 border border-primary/20 rounded font-mono text-sm relative group">
              <div className="absolute top-0 right-0 px-2 py-1 text-[10px] uppercase text-primary/50 border-b border-l border-primary/20 rounded-bl bg-primary/5">Result</div>
              <div className="text-primary/90 break-words pt-2">
                {typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}
              </div>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
