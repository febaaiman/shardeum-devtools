import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  Activity, 
  Code2, 
  TerminalSquare, 
  Search, 
  Wallet,
  Menu,
  Terminal
} from "lucide-react";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Network Monitor", url: "/", icon: Activity },
  { title: "Contract Deployer", url: "/deploy", icon: Code2 },
  { title: "Debugger", url: "/debug", icon: TerminalSquare },
  { title: "Tx Explorer", url: "/explorer", icon: Search },
  { title: "Wallet Checker", url: "/wallet", icon: Wallet },
];

function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar variant="inset" className="border-r border-border/50">
      <SidebarHeader className="h-14 flex items-center px-4 border-b border-border/50">
        <div className="flex items-center gap-2 font-mono text-primary font-bold">
          <Terminal className="w-5 h-5" />
          <span>shardeum_cli</span>
          <span className="animate-pulse">_</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className={isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}
                    >
                      <Link href={item.url} className="flex items-center gap-3 px-3 py-2 transition-all">
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function TopHeader() {
  const [location] = useLocation();
  const currentItem = navItems.find(item => item.url === location);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/50 bg-background/95 backdrop-blur px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="w-px h-4 bg-border mx-2" />
      <div className="font-mono text-sm text-muted-foreground flex items-center">
        <span className="text-primary">~/</span>
        {currentItem?.title.toLowerCase().replace(" ", "_") || "unknown"}
      </div>
    </header>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider style={{ "--sidebar-width": "16rem" } as React.CSSProperties}>
      <div className="flex min-h-screen w-full bg-background selection:bg-primary/30">
        <AppSidebar />
        <div className="flex flex-col flex-1 w-full overflow-hidden">
          <TopHeader />
          <main className="flex-1 overflow-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat relative">
            <div className="absolute inset-0 bg-background/90 z-0 mix-blend-multiply" />
            <div className="relative z-10 h-full p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
