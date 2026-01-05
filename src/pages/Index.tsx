import { Layout } from '@/components/layout/Layout';
import { CalendarView } from '@/components/calendar/CalendarView';
import { DayTimeline } from '@/components/calendar/DayTimeline';
import { NetworkStats } from '@/components/calendar/NetworkStats';

const Index = () => {
  return (
    <Layout>
      <div className="p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Calendário Editorial
          </h1>
          <p className="text-muted-foreground">
            Gerencie todos os seus posts agendados em um só lugar
          </p>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          {/* Calendar */}
          <div>
            <CalendarView />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <DayTimeline />
            <NetworkStats />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
