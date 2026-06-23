import { useState } from 'react'
import { User, Shield, Bell } from 'lucide-react'

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    payments: true,
    goals: true,
    reminders: false,
    marketing: false,
  })

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-dark">Settings</h2>
        <p className="text-sm text-slate-500 mt-1">Manage your account preferences.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
        <h3 className="font-semibold text-dark flex items-center gap-2">
          <User size={16} />
          Personal Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">First Name</label>
            <input defaultValue="Adebayo" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Last Name</label>
            <input defaultValue="Okonkwo" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
          <input defaultValue="adebayo@thrivefund.ng" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Phone Number</label>
          <input defaultValue="+234 803 456 7890" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
        </div>
        <button className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors">
          Save Changes
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
        <h3 className="font-semibold text-dark flex items-center gap-2">
          <Shield size={16} />
          Security
        </h3>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Current Password</label>
          <input type="password" placeholder="Enter current password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">New Password</label>
          <input type="password" placeholder="Enter new password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
        </div>
        <button className="bg-slate-100 text-dark px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors">
          Update Password
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-dark flex items-center gap-2">
          <Bell size={16} />
          Notification Preferences
        </h3>
        {[
          { key: 'payments' as const, label: 'Payment received', desc: 'Get notified when a contribution arrives' },
          { key: 'goals' as const, label: 'Goal updates', desc: 'Milestones and completion alerts' },
          { key: 'reminders' as const, label: 'Reminders', desc: 'Deadline and contribution reminders' },
          { key: 'marketing' as const, label: 'Product updates', desc: 'News and feature announcements' },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-dark">{label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
            </div>
            <button
              onClick={() => setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${notifications[key] ? 'bg-primary' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifications[key] ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
