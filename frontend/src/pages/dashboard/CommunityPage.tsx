import { ProgressBar } from '../../components/ui'
import { goals, formatNaira, calcProgress } from '../../data/mockData'

export default function CommunityPage() {
  const communityGoals = goals.filter((g) => g.category === 'Community Project' || g.category === 'Religious')

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-dark">Community Projects</h2>
        <p className="text-sm text-slate-500 mt-1">Fundraising for communities, mosques, churches, and cooperatives</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {communityGoals.map((g) => (
          <div key={g.id} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700">{g.category}</span>
              <span className="text-xs text-slate-400">{g.contributors} contributors</span>
            </div>
            <h3 className="font-semibold text-dark mb-4">{g.name}</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-dark">{formatNaira(g.raised)}</span>
                <span className="text-slate-500">of {formatNaira(g.target)}</span>
              </div>
              <ProgressBar value={calcProgress(g.raised, g.target)} color={g.color} />
              <p className="text-xs text-slate-400">{g.daysLeft > 0 ? `${g.daysLeft} days remaining` : 'Goal completed'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
