import { useState } from "react"
import { useAdminUserAnalytics, useAdminPostAnalytics, useAdminEngagementAnalytics, useAdminAnalyticsOverview } from "../../services/admin"
import { Loader2, Users, FileText, MessageSquare } from "lucide-react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import { cn } from "../../lib/utils"

const PERIODS = [
  { value: "7d" as const, label: "7 Days" },
  { value: "30d" as const, label: "30 Days" },
  { value: "90d" as const, label: "90 Days" },
]

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

export function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d")

  const { data: overview } = useAdminAnalyticsOverview()
  const { data: userAnalytics, isLoading: loadingUsers } = useAdminUserAnalytics(period)
  const { data: postAnalytics, isLoading: loadingPosts } = useAdminPostAnalytics(period)
  const { data: engagementAnalytics, isLoading: loadingEngagement } = useAdminEngagementAnalytics(period)

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-geist font-semibold transition-colors cursor-pointer border",
              period === p.value
                ? "bg-primary text-white border-primary"
                : "text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={Users} label="Total Users" value={overview?.totalUsers ?? 0} color="blue" />
        <SummaryCard icon={FileText} label="Total Posts" value={overview?.totalPosts ?? 0} color="green" />
        <SummaryCard icon={MessageSquare} label="Total Comments" value={overview?.totalComments ?? 0} color="purple" />
        <SummaryCard icon={ThumbsUpIcon} label="Posts Today" value={overview?.postsToday ?? 0} color="amber" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <ChartCard title="User Growth" loading={loadingUsers}>
          {userAnalytics && userAnalytics.userGrowth.length > 0 && (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={userAnalytics.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} name="New Users" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Post Trend Chart */}
        <ChartCard title="Post Activity" loading={loadingPosts}>
          {postAnalytics && postAnalytics.postTrend.length > 0 && (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={postAnalytics.postTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} name="Posts" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Role Distribution Pie */}
        <ChartCard title="User Role Distribution" loading={loadingUsers}>
          {userAnalytics && userAnalytics.roleDistribution.length > 0 && (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={userAnalytics.roleDistribution}
                  dataKey="count"
                  nameKey="role"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  label={({ role, count }: any) => `${role}: ${count}`}
                  labelLine={false}
                >
                  {userAnalytics.roleDistribution.map((_entry: unknown, idx: number) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Engagement Chart */}
        <ChartCard title="Engagement (Comments + Votes)" loading={loadingEngagement}>
          {engagementAnalytics && engagementAnalytics.commentTrend.length > 0 && (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={engagementAnalytics.commentTrend.map((d: { date: string; count: number }, i: number) => ({
                date: d.date,
                Comments: d.count,
                Votes: engagementAnalytics.voteTrend[i]?.count || 0,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Comments" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Votes" stroke="#06b6d4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Additional stat cards for post status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl">
          <p className="text-xs font-bold font-geist text-gray-500 uppercase tracking-widest">Published Posts</p>
          <p className="text-2xl font-bold font-geist text-green-600 dark:text-green-400 mt-1">{postAnalytics?.publishedPosts ?? 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl">
          <p className="text-xs font-bold font-geist text-gray-500 uppercase tracking-widest">Draft / Flagged</p>
          <p className="text-2xl font-bold font-geist text-amber-600 dark:text-amber-400 mt-1">{postAnalytics?.draftPosts ?? 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl">
          <p className="text-xs font-bold font-geist text-gray-500 uppercase tracking-widest">Total Engagement</p>
          <p className="text-2xl font-bold font-geist text-purple-600 dark:text-purple-400 mt-1">
            {(engagementAnalytics?.totalComments ?? 0) + (engagementAnalytics?.totalVotes ?? 0)}
          </p>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-950/20",
    green: "text-green-600 bg-green-50 dark:bg-green-950/20",
    purple: "text-purple-600 bg-purple-50 dark:bg-purple-950/20",
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-950/20",
  }
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl flex items-center justify-between">
      <div>
        <p className="text-xs font-bold font-geist text-gray-500 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-bold font-geist text-on-surface mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-xl ${colorMap[color] || colorMap.blue}`}>
        <Icon size={20} />
      </div>
    </div>
  )
}

function ChartCard({ title, loading, children }: { title: string; loading: boolean; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
      <h3 className="text-sm font-bold font-geist text-on-surface mb-4">{title}</h3>
      {loading ? (
        <div className="flex items-center justify-center h-[280px]">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : children}
    </div>
  )
}

function ThumbsUpIcon(props: { size?: number; className?: string }) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 22V11M2 13v7a2 2 0 002 2h12.4a2 2 0 001.95-1.57l1.6-7A2 2 0 0018 11H13V5a3 3 0 00-3-3l-3 6v10z" />
    </svg>
  )
}
