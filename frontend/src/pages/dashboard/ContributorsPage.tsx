import { Avatar } from '../../components/ui'
import { contributors, formatNaira } from '../../data/mockData'

export default function ContributorsPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-dark">Contributors</h2>
        <p className="text-sm text-slate-500 mt-1">{contributors.length} people have contributed to your goals</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3 font-medium">Contributor</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Total Contributed</th>
                <th className="px-6 py-3 font-medium">Goals</th>
                <th className="px-6 py-3 font-medium">Last Contribution</th>
              </tr>
            </thead>
            <tbody>
              {contributors.map((c) => (
                <tr key={c.email} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar initials={c.avatar} size="sm" />
                      <span className="font-medium text-dark">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{c.email}</td>
                  <td className="px-6 py-4 font-medium text-dark">{formatNaira(c.total)}</td>
                  <td className="px-6 py-4 text-slate-500">{c.goals}</td>
                  <td className="px-6 py-4 text-slate-500">{c.last}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
