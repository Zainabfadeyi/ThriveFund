import { TrendingUp, TrendingDown, Check, Clock, X, LucideIcon } from 'lucide-react'

const statusStyles: Record<string, string> = {
  successful: 'bg-emerald-50 text-emerald-700',
  reconciled: 'bg-emerald-50 text-emerald-700',
  active: 'bg-blue-50 text-blue-700',
  pending: 'bg-amber-50 text-amber-700',
  failed: 'bg-red-50 text-red-700',
  completed: 'bg-slate-100 text-slate-600',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-slate-100 text-slate-600'}`}>
      {(status === 'successful' || status === 'reconciled') && <Check size={10} />}
      {status === 'pending' && <Clock size={10} />}
      {status === 'failed' && <X size={10} />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export function ProgressBar({ value, color = '#00A86B' }: { value: number; color?: string }) {
  return (
    <div className="w-full bg-slate-100 rounded-full h-2">
      <div
        className="h-2 rounded-full transition-all duration-500"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
  )
}

const avatarColors = [
  'bg-emerald-100 text-emerald-700',
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
]

const avatarSizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }

export function Avatar({ initials, size = 'md' }: { initials: string; size?: 'sm' | 'md' | 'lg' }) {
  const colorClass = avatarColors[initials.charCodeAt(0) % avatarColors.length]
  return (
    <div className={`${avatarSizes[size]} ${colorClass} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}>
      {initials}
    </div>
  )
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  trendVal,
}: {
  label: string
  value: string
  sub?: string
  icon: LucideIcon
  trend?: 'up' | 'down'
  trendVal?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-dark mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
        <div className="p-2.5 rounded-xl bg-primary/10">
          <Icon size={18} className="text-primary" />
        </div>
      </div>
      {trendVal && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trendVal}
          <span className="text-slate-500 font-normal">vs last month</span>
        </div>
      )}
    </div>
  )
}

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const iconSize = size === 'sm' ? 13 : 16
  const boxClass = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8'
  const textClass = size === 'sm' ? 'text-base' : 'text-lg'

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${boxClass} bg-primary rounded-lg flex items-center justify-center flex-shrink-0`}>
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>
      <span className={`font-bold text-dark ${textClass}`}>ThriveFund</span>
    </div>
  )
}

export function LogoWhite({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const iconSize = size === 'sm' ? 13 : 16
  const boxClass = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8'
  const textClass = size === 'sm' ? 'text-base' : 'text-lg'

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${boxClass} bg-primary rounded-lg flex items-center justify-center flex-shrink-0`}>
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>
      <span className={`text-white font-bold ${textClass}`}>ThriveFund</span>
    </div>
  )
}
