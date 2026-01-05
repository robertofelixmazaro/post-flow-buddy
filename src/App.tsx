import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NetworksProvider } from "./hooks/useNetworks";
import Index from "./pages/Index";
import CreatePost from "./pages/CreatePost";
import MediaLibrary from "./pages/MediaLibrary";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <NetworksProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/criar" element={<CreatePost />} />
            <Route path="/biblioteca" element={<MediaLibrary />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/configuracoes" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </NetworksProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
