import { StatusBadge } from '../../components/ui'
import { transactions, formatNaira } from '../../data/mockData'

export default function TransactionsPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-dark">Transactions</h2>
        <p className="text-sm text-slate-500 mt-1">{transactions.length} transactions recorded</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3 font-medium">ID</th>
                <th className="px-6 py-3 font-medium">Contributor</th>
                <th className="px-6 py-3 font-medium">Goal</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">{t.id}</td>
                  <td className="px-6 py-4 font-medium text-dark">{t.contributor}</td>
                  <td className="px-6 py-4 text-slate-500">{t.goal}</td>
                  <td className="px-6 py-4 font-medium text-dark">{formatNaira(t.amount)}</td>
                  <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                  <td className="px-6 py-4 text-slate-500">{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
