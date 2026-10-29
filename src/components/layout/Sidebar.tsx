import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  PenSquare, 
  Image, 
  BarChart3, 
  Settings, 
  Menu, 
  X,
  Zap,
  ClipboardList,
  LogOut,
  UserCircle,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useScheduledPosts } from '@/hooks/useScheduledPosts';

const navItems = [
  { icon: Calendar, label: 'Calendário', path: '/' },
  { icon: PenSquare, label: 'Criar Post', path: '/criar' },
  { icon: ClipboardList, label: 'Agendamentos', path: '/agendamentos' },
  { icon: FileText, label: 'Logs', path: '/logs' },
  { icon: Image, label: 'Biblioteca', path: '/biblioteca' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: UserCircle, label: 'Meu Perfil', path: '/perfil' },
  { icon: Settings, label: 'Configurações', path: '/configuracoes' },
];

export function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { signOut, user } = useAuth();
  const { data: posts } = useScheduledPosts();
  
  const scheduledCount = posts?.filter(p => p.status === 'scheduled').length || 0;

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border z-50",
        "transform transition-transform duration-300 ease-in-out",
        "md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-4">
          {/* Logo */}
          <div className="flex items-center gap-2 px-2 py-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Agenda Plus</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive && "bg-primary/10 text-primary border-l-2 border-primary"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5",
                    isActive && "text-primary"
                  )} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Stats footer */}
          <div className="border-t border-sidebar-border pt-4 mt-4">
            <div className="bg-sidebar-accent rounded-xl p-4 mb-4">
              <div className="text-sm text-muted-foreground mb-2">Posts agendados</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">{scheduledCount}</span>
                <span className="text-xs text-muted-foreground">pendentes</span>
              </div>
            </div>
            
            {user && (
              <div className="px-2">
                <p className="text-xs text-muted-foreground truncate mb-2">{user.email}</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
