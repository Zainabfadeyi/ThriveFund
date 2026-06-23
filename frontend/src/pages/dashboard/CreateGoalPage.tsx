import { useNavigate } from 'react-router-dom'

export default function CreateGoalPage() {
  const navigate = useNavigate()

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-dark">Create a New Goal</h2>
        <p className="text-sm text-slate-500 mt-1">Set up a savings goal and get a dedicated virtual account instantly.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Goal Name</label>
          <input
            placeholder="e.g. Abuja Community Water Project"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
          <textarea
            rows={3}
            placeholder="Describe your goal and what the funds will be used for..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Target Amount (₦)</label>
            <input
              type="number"
              placeholder="5000000"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Category</label>
            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all">
              <option>Community Project</option>
              <option>Wedding</option>
              <option>Religious</option>
              <option>Education</option>
              <option>Business</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Deadline</label>
          <input
            type="date"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => navigate('/dashboard/goals')}
            className="flex-1 bg-slate-100 text-dark py-2.5 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => navigate('/dashboard/goals')}
            className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            Create Goal
          </button>
        </div>
      </div>
    </div>
  )
}
