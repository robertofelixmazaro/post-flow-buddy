import { Layout } from '@/components/layout/Layout';
import { analyticsData, NetworkType, getNetworkName, getNetworkColor } from '@/data/mockData';
import { NetworkBadge } from '@/components/ui/NetworkBadge';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Heart,
  Calendar,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const statsCards = [
  { 
    label: 'Posts Publicados', 
    value: analyticsData.totalPosts, 
    icon: Calendar,
    trend: '+12%',
    trendUp: true
  },
  { 
    label: 'Engajamento Total', 
    value: analyticsData.totalEngagement.toLocaleString(), 
    icon: Heart,
    trend: '+23%',
    trendUp: true
  },
  { 
    label: 'Média por Post', 
    value: analyticsData.avgEngagement, 
    icon: MessageSquare,
    trend: '+8%',
    trendUp: true
  },
  { 
    label: 'Taxa de Crescimento', 
    value: `${analyticsData.growthRate}%`, 
    icon: TrendingUp,
    trend: '+5%',
    trendUp: true
  },
];

const pieColors = [
  'hsl(330, 80%, 60%)', // Instagram
  'hsl(220, 70%, 55%)', // Facebook
  'hsl(200, 90%, 55%)', // Twitter
  'hsl(210, 80%, 50%)', // LinkedIn
];

export default function Analytics() {
  return (
    <Layout>
      <div className="p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Analytics
          </h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho das suas publicações
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statsCards.map((stat, index) => (
            <div 
              key={stat.label}
              className="bg-card rounded-2xl border border-border p-5 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <span className={`flex items-center gap-1 text-sm font-medium ${stat.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.trendUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {stat.trend}
                </span>
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Weekly chart */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-4">Engajamento Semanal</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.weeklyData}>
                  <XAxis 
                    dataKey="day" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(220, 14%, 10%)',
                      border: '1px solid hsl(220, 14%, 20%)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(210, 20%, 98%)' }}
                  />
                  <Bar 
                    dataKey="engagement" 
                    fill="hsl(127, 98%, 48%)" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Network distribution */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-4">Distribuição por Rede</h3>
            <div className="flex items-center gap-6">
              <div className="h-48 w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.networkStats}
                      dataKey="engagement"
                      nameKey="network"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {analyticsData.networkStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {analyticsData.networkStats.map((stat, index) => (
                  <div key={stat.network} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: pieColors[index] }}
                      />
                      <span className="text-sm text-foreground">{getNetworkName(stat.network)}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {stat.engagement.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Network details */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold text-foreground">Desempenho por Rede</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Rede</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Posts</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Engajamento</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Seguidores</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Média</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.networkStats.map(stat => (
                  <tr key={stat.network} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <NetworkBadge network={stat.network} size="sm" />
                    </td>
                    <td className="p-4 text-right text-foreground font-medium">{stat.posts}</td>
                    <td className="p-4 text-right text-foreground font-medium">{stat.engagement.toLocaleString()}</td>
                    <td className="p-4 text-right text-foreground font-medium">{stat.followers.toLocaleString()}</td>
                    <td className="p-4 text-right text-primary font-medium">
                      {Math.round(stat.engagement / stat.posts)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
