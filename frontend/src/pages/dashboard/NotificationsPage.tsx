import { Bell, Target, Users, Clock, Shield } from 'lucide-react'
import { notifications } from '../../data/mockData'

const iconMap: Record<string, typeof Bell> = {
  payment: Bell,
  goal: Target,
  contributor: Users,
  reminder: Clock,
  system: Shield,
}

export default function NotificationsPage() {
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-dark">Notifications</h2>
        <p className="text-sm text-slate-500 mt-1">{notifications.filter((n) => n.unread).length} unread notifications</p>
      </div>

      <div className="space-y-3">
        {notifications.map((n, i) => {
          const Icon = iconMap[n.type] || Bell
          return (
            <div
              key={i}
              className={`bg-white rounded-2xl border p-4 flex gap-4 transition-colors ${
                n.unread ? 'border-primary/20 bg-primary/5' : 'border-slate-200'
              }`}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${n.color}15` }}
              >
                <Icon size={18} style={{ color: n.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-dark">{n.title}</p>
                  {n.unread && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />}
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{n.body}</p>
                <p className="text-xs text-slate-400 mt-1">{n.time}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
