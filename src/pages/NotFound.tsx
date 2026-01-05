import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl font-bold text-primary mb-4">404</div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Página não encontrada
        </h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link to="/">
              <Home className="w-4 h-4" />
              Início
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;