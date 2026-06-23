import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { goals, formatNaira } from '../../data/mockData'

export default function VirtualAccountsPage() {
  const [copied, setCopied] = useState<number | null>(null)

  const copyAccount = (id: number, account: string) => {
    navigator.clipboard.writeText(account.split(' - ')[0])
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-dark">Virtual Accounts</h2>
        <p className="text-sm text-slate-500 mt-1">Dedicated bank accounts for each of your goals</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {goals.filter((g) => g.status === 'active').map((g) => (
          <div key={g.id} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700">{g.category}</span>
                <h3 className="font-semibold text-dark mt-2">{g.name}</h3>
              </div>
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00A86B" strokeWidth="2">
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 mb-4">
              <p className="text-xs text-slate-500 mb-1">Account Number</p>
              <p className="font-mono font-semibold text-dark text-lg">012345678{g.id}</p>
              <p className="text-xs text-slate-500 mt-1">First Bank · ThriveFund / {g.name.slice(0, 20)}</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Total received</p>
                <p className="font-semibold text-dark">{formatNaira(g.raised)}</p>
              </div>
              <button
                onClick={() => copyAccount(g.id, `012345678${g.id}`)}
                className="flex items-center gap-1.5 bg-primary/10 py-2 px-3 rounded-lg text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                {copied === g.id ? <Check size={12} /> : <Copy size={12} />}
                {copied === g.id ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
