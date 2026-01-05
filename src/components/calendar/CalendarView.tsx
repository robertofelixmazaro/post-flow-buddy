import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { scheduledPosts, ScheduledPost, NetworkType } from '@/data/mockData';
import { NetworkBadge } from '@/components/ui/NetworkBadge';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  posts: ScheduledPost[];
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const current = new Date(startDate);
    while (current <= endDate) {
      const dayPosts = scheduledPosts.filter(post => {
        const postDate = new Date(post.scheduledDate);
        return postDate.toDateString() === current.toDateString();
      });
      
      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        isToday: current.toDateString() === today.toDateString(),
        posts: dayPosts,
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentDate]);

  const navigateMonth = (direction: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold text-foreground min-w-[180px] text-center">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <Link to="/criar">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Post
          </Button>
        </Link>
      </div>

      {/* Days header */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAYS.map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={cn(
              "min-h-[120px] p-2 border-b border-r border-border",
              !day.isCurrentMonth && "bg-muted/30",
              day.isToday && "bg-primary/5",
              "transition-colors hover:bg-accent/30"
            )}
          >
            <div className={cn(
              "text-sm mb-2",
              day.isToday 
                ? "w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold"
                : day.isCurrentMonth ? "text-foreground" : "text-muted-foreground"
            )}>
              {day.date.getDate()}
            </div>
            <div className="space-y-1">
              {day.posts.slice(0, 3).map(post => (
                <div
                  key={post.id}
                  className="group flex items-center gap-1 p-1 rounded text-xs bg-accent/50 hover:bg-accent cursor-pointer transition-colors"
                >
                  <NetworkBadge network={post.network} size="sm" showLabel={false} className="!p-0.5" />
                  <span className="truncate text-foreground/80">{post.scheduledTime}</span>
                </div>
              ))}
              {day.posts.length > 3 && (
                <div className="text-xs text-muted-foreground pl-1">
                  +{day.posts.length - 3} mais
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
