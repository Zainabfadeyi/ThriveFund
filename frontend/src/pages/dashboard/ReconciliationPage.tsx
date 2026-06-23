import { StatusBadge } from '../../components/ui'
import { virtualAccounts, formatNaira } from '../../data/mockData'

export default function ReconciliationPage() {
  const reconciled = virtualAccounts.filter((v) => v.status === 'reconciled').length
  const pending = virtualAccounts.filter((v) => v.status === 'pending').length

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-dark">Reconciliation</h2>
        <p className="text-sm text-slate-500 mt-1">Automatic payment matching and reconciliation status</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Total Reconciled</p>
          <p className="text-2xl font-bold text-dark mt-1">{reconciled}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{pending}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Auto-match Rate</p>
          <p className="text-2xl font-bold text-primary mt-1">98.5%</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3 font-medium">Reference</th>
                <th className="px-6 py-3 font-medium">Account</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {virtualAccounts.map((v) => (
                <tr key={v.ref} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{v.ref}</td>
                  <td className="px-6 py-4 text-dark">{v.account}</td>
                  <td className="px-6 py-4 font-medium text-dark">{formatNaira(v.amount)}</td>
                  <td className="px-6 py-4"><StatusBadge status={v.status} /></td>
                  <td className="px-6 py-4 text-slate-500">{v.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
