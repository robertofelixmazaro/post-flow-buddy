import { useMemo } from 'react';
import { scheduledPosts, ScheduledPost } from '@/data/mockData';
import { PostCard } from './PostCard';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function DayTimeline() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const todaysPosts = useMemo(() => {
    return scheduledPosts
      .filter(post => {
        const postDate = new Date(post.scheduledDate);
        return postDate.toDateString() === selectedDate.toDateString();
      })
      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  }, [selectedDate]);

  const navigateDay = (direction: number) => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + direction);
      return newDate;
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    if (compareDate.getTime() === today.getTime()) {
      return 'Hoje';
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (compareDate.getTime() === tomorrow.getTime()) {
      return 'Amanhã';
    }
    
    return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-4 h-fit">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Agenda do Dia</h3>
        </div>
      </div>

      {/* Date navigation */}
      <div className="flex items-center justify-between mb-4 bg-muted/50 rounded-lg p-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDay(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <div className="font-semibold text-foreground">{formatDate(selectedDate)}</div>
          <div className="text-xs text-muted-foreground">
            {DAYS[selectedDate.getDay()]}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDay(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Posts list */}
      <div className="space-y-3">
        {todaysPosts.length > 0 ? (
          todaysPosts.map(post => (
            <PostCard key={post.id} post={post} variant="full" />
          ))
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              Nenhum post agendado para este dia
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
