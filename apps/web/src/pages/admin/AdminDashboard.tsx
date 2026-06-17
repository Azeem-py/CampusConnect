import { useAdminAnalyticsOverview } from "../../services/admin"
import { Loader2, Users, FileText, MessageSquare, Building2, Ban, AlertTriangle, TrendingUp, Activity } from "lucide-react"

export function AdminDashboard() {
  const { data: overview, isLoading } = useAdminAnalyticsOverview()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    )
  }

  const cards = [
    { label: "Total Users", value: overview?.totalUsers ?? 0, icon: Users, color: "blue" },
    { label: "Total Posts", value: overview?.totalPosts ?? 0, icon: FileText, color: "green" },
    { label: "Total Comments", value: overview?.totalComments ?? 0, icon: MessageSquare, color: "purple" },
    { label: "Schools", value: overview?.totalInstitutions ?? 0, icon: Building2, color: "amber" },
    { label: "Departments", value: overview?.totalDepartments ?? 0, icon: Building2, color: "indigo" },
    { label: "Banned Words", value: overview?.totalBannedWords ?? 0, icon: Ban, color: "red" },
    { label: "Pending Reports", value: overview?.pendingReports ?? 0, icon: AlertTriangle, color: "orange" },
    { label: "Banned Users", value: overview?.bannedUsers ?? 0, icon: Users, color: "rose" },
  ]

  const colorClasses: Record<string, { bg: string; text: string; iconBg: string }> = {
    blue: { bg: "bg-blue-50/20 dark:bg-blue-950/10 border-blue-200/40", text: "text-blue-700 dark:text-blue-300", iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    green: { bg: "bg-green-50/20 dark:bg-green-950/10 border-green-200/40", text: "text-green-700 dark:text-green-300", iconBg: "bg-green-500/10 text-green-600 dark:text-green-400" },
    purple: { bg: "bg-purple-50/20 dark:bg-purple-950/10 border-purple-200/40", text: "text-purple-700 dark:text-purple-300", iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
    amber: { bg: "bg-amber-50/20 dark:bg-amber-950/10 border-amber-200/40", text: "text-amber-700 dark:text-amber-300", iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    indigo: { bg: "bg-indigo-50/20 dark:bg-indigo-950/10 border-indigo-200/40", text: "text-indigo-700 dark:text-indigo-300", iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
    red: { bg: "bg-red-50/20 dark:bg-red-950/10 border-red-200/40", text: "text-red-700 dark:text-red-300", iconBg: "bg-red-500/10 text-red-600 dark:text-red-400" },
    orange: { bg: "bg-orange-50/20 dark:bg-orange-950/10 border-orange-200/40", text: "text-orange-700 dark:text-orange-300", iconBg: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
    rose: { bg: "bg-rose-50/20 dark:bg-rose-950/10 border-rose-200/40", text: "text-rose-700 dark:text-rose-300", iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  }

  return (
    <div className="space-y-6">
      {/* Activity section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <Activity size={16} />
            <span className="text-xs font-bold font-geist uppercase tracking-widest">Today</span>
          </div>
          <p className="text-2xl font-bold font-geist text-on-surface mt-2">{overview?.postsToday ?? 0}</p>
          <p className="text-xs text-on-surface-variant">new posts</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Users size={16} />
            <span className="text-xs font-bold font-geist uppercase tracking-widest">Today</span>
          </div>
          <p className="text-2xl font-bold font-geist text-on-surface mt-2">{overview?.newUsersToday ?? 0}</p>
          <p className="text-xs text-on-surface-variant">new users</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <TrendingUp size={16} />
            <span className="text-xs font-bold font-geist uppercase tracking-widest">Growth</span>
          </div>
          <p className="text-2xl font-bold font-geist text-on-surface mt-2">{overview?.usersGrowth ?? "0%"}</p>
          <p className="text-xs text-on-surface-variant">user growth (30d)</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const colors = colorClasses[card.color]
          return (
            <div key={card.label} className={`${colors.bg} border p-4 rounded-2xl flex items-center justify-between shadow-sm`}>
              <div className="space-y-1">
                <p className="text-xs font-bold font-geist uppercase tracking-widest text-on-surface-variant">
                  {card.label}
                </p>
                <p className={`text-3xl font-bold font-geist ${colors.text}`}>
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${colors.iconBg}`}>
                <card.icon size={22} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
