import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, ChevronRight } from 'lucide-react'
import { ProgressBar, StatusBadge } from '../../components/ui'
import { goals, formatNaira, calcProgress } from '../../data/mockData'

export default function GoalsPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const filtered = goals.filter((g) => filter === 'all' || g.status === filter)

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-dark">Your Goals</h2>
          <p className="text-sm text-slate-500 mt-1">{goals.length} goals · {goals.filter((g) => g.status === 'active').length} active</p>
        </div>
        <Link
          to="/dashboard/goals/create"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors self-start sm:self-auto"
        >
          <PlusCircle size={16} />
          Create Goal
        </Link>
      </div>

      <div className="flex gap-2">
        {(['all', 'active', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === f ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:text-dark'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((g) => (
          <div key={g.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow group cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div>
                <StatusBadge status={g.status} />
                <h3 className="font-semibold text-dark text-sm leading-snug mt-1 group-hover:text-primary transition-colors">{g.name}</h3>
              </div>
              <ChevronRight size={16} className="text-slate-400 flex-shrink-0 group-hover:text-primary transition-colors mt-1" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">{formatNaira(g.raised)} raised</span>
                <span className="text-slate-500">{formatNaira(g.target)} target</span>
              </div>
              <ProgressBar value={calcProgress(g.raised, g.target)} color={g.color} />
              <div className="flex justify-between text-xs text-slate-400">
                <span>{g.contributors} contributors</span>
                <span>{g.daysLeft > 0 ? `${g.daysLeft} days left` : 'Completed'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
