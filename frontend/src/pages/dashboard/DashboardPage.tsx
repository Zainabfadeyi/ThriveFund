import { Link } from 'react-router-dom'
import { PlusCircle, ChevronRight, Wallet, Target, Users, TrendingUp } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { StatCard } from '../../components/ui'
import { goals, transactions, monthlyContributions, formatNaira } from '../../data/mockData'

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-dark">Good morning, Adebayo 👋</h2>
          <p className="text-sm text-slate-500 mt-1">Here&apos;s what&apos;s happening with your goals today.</p>
        </div>
        <Link
          to="/dashboard/goals/create"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors self-start sm:self-auto"
        >
          <PlusCircle size={16} />
          Create Goal
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Saved" value="₦18.4M" icon={Wallet} trend="up" trendVal="+23%" />
        <StatCard label="Active Goals" value="5" sub="2 completed" icon={Target} trend="up" trendVal="+2" />
        <StatCard label="Contributors" value="910" icon={Users} trend="up" trendVal="+14%" />
        <StatCard label="This Month" value="₦4.1M" icon={TrendingUp} trend="up" trendVal="+20%" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-dark mb-4">Monthly Contributions</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyContributions}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00A86B" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#00A86B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${(v / 1_000_000).toFixed(1)}M`} />
              <Tooltip formatter={(v: number) => [formatNaira(v), 'Amount']} />
              <Area type="monotone" dataKey="amount" stroke="#00A86B" strokeWidth={2.5} fill="url(#areaGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-dark">Recent Goals</h3>
            <Link to="/dashboard/goals" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {goals.slice(0, 4).map((g) => (
              <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark truncate">{g.name}</p>
                  <p className="text-xs text-slate-500">{formatNaira(g.raised)} raised</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-dark">Recent Transactions</h3>
          <Link to="/dashboard/transactions" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
            View all <ChevronRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                <th className="pb-3 font-medium">Contributor</th>
                <th className="pb-3 font-medium">Goal</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 5).map((t) => (
                <tr key={t.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 font-medium text-dark">{t.contributor}</td>
                  <td className="py-3 text-slate-500">{t.goal}</td>
                  <td className="py-3 font-medium text-dark">{formatNaira(t.amount)}</td>
                  <td className="py-3 text-slate-500">{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
