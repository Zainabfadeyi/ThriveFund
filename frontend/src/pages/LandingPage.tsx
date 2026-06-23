import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  PlusCircle,
  Play,
  Target,
  Building2,
  RefreshCw,
  UserPlus,
  BarChart3,
  Shield,
  ChevronDown,
  Star,
} from 'lucide-react'
import { Logo, LogoWhite, Avatar } from '../components/ui'
import { features, howItWorks, testimonials, faqs, monthlyContributions } from '../data/mockData'

const featureIcons = [Target, Building2, RefreshCw, UserPlus, BarChart3, Shield]

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const maxAmount = Math.max(...monthlyContributions.map((m) => m.amount))

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#features" className="hover:text-dark transition-colors">Features</a>
            <a href="#how" className="hover:text-dark transition-colors">How It Works</a>
            <a href="#testimonials" className="hover:text-dark transition-colors">Testimonials</a>
            <a href="#faq" className="hover:text-dark transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-dark transition-colors px-3 py-2">
              Sign In
            </Link>
            <Link to="/signup" className="text-sm font-medium bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary-dark transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F0FDF4] via-white to-[#EFF6FF] -z-10" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/8 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-dark/5 rounded-full blur-2xl -z-10" />

        <div className="max-w-6xl mx-auto px-6 pt-24 pb-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-2 rounded-full mb-8">
              <Sparkles size={12} />
              Now live for Nigerian businesses & communities
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-dark leading-tight mb-6">
              Save, collect, and reconcile{' '}
              <span className="text-primary">payments effortlessly.</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Generate dedicated virtual accounts for goals, projects, schools, communities, and organizations — while automatically tracking every contribution in real time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-semibold text-base hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
              >
                <PlusCircle size={18} />
                Create Goal Free
              </Link>
              <button className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-dark px-8 py-4 rounded-xl font-semibold text-base hover:border-slate-300 hover:shadow-sm transition-all">
                <Play size={18} />
                Watch Demo
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-5">No credit card required. Free to start.</p>
          </div>

          <div className="mt-16 relative">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
              <div className="bg-dark px-6 py-4 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-white/10 rounded-lg px-3 py-1 text-xs text-slate-400 text-center">
                  app.thrivefund.ng/dashboard
                </div>
              </div>
              <div className="grid grid-cols-4 gap-0">
                <div className="bg-dark p-4 col-span-1 min-h-[280px] hidden sm:block">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </div>
                    <span className="text-white text-xs font-bold">ThriveFund</span>
                  </div>
                  {['Dashboard', 'Goals', 'Transactions', 'Accounts'].map((item, i) => (
                    <div
                      key={item}
                      className={`text-xs py-2 px-2 rounded-lg mb-1 ${i === 0 ? 'bg-primary text-white' : 'text-slate-400'}`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
                <div className="col-span-4 sm:col-span-3 p-4 bg-[#F8FAFC]">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    {[['Total Saved', '₦18.4M', '+23%'], ['Active Goals', '5', '+2'], ['Contributors', '910', '+14%'], ['This Month', '₦4.1M', '+20%']].map(([label, value, change]) => (
                      <div key={label} className="bg-white rounded-xl p-3 border border-slate-100">
                        <p className="text-[10px] text-slate-400">{label}</p>
                        <p className="text-sm font-bold text-dark">{value}</p>
                        <p className="text-[10px] text-primary font-medium">{change}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] font-semibold text-slate-400 mb-2">MONTHLY CONTRIBUTIONS</p>
                    <div className="flex items-end gap-1.5 h-16">
                      {monthlyContributions.map((m, i) => (
                        <div
                          key={m.month}
                          className="flex-1 rounded-sm"
                          style={{
                            height: `${(m.amount / maxAmount) * 100}%`,
                            background: i === 5 ? '#00A86B' : '#E2E8F0',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-primary text-sm font-semibold mb-2">FEATURES</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-dark">Everything you need to collect funds</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              Built for individuals, schools, churches, mosques, cooperatives, and businesses across Nigeria.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ title, desc }, i) => {
              const Icon = featureIcons[i]
              return (
                <div key={title} className="p-6 rounded-2xl border border-slate-100 hover:border-primary/30 hover:shadow-md transition-all group">
                  <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                    <Icon size={20} className="text-primary group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-semibold text-dark mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="how" className="py-24 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-primary text-sm font-semibold mb-2">HOW IT WORKS</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-dark">Start collecting in minutes</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map(({ n, title, desc }) => (
              <div key={n} className="relative bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-dark flex items-center justify-center mb-5">
                  <span className="text-sm font-bold text-primary">{n}</span>
                </div>
                <h3 className="font-semibold text-dark mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-primary text-sm font-semibold mb-2">TESTIMONIALS</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-dark">Trusted by communities across Nigeria</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-[#F8FAFC] rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill="#F59E0B" className="text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <Avatar initials={t.avatar} />
                  <div>
                    <p className="text-sm font-semibold text-dark">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-24 bg-[#F8FAFC]">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-primary text-sm font-semibold mb-2">FAQ</p>
            <h2 className="text-3xl font-bold text-dark">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map(({ q, a }, i) => (
              <div key={q} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-sm font-medium text-dark hover:bg-slate-50 transition-colors"
                >
                  {q}
                  <ChevronDown size={16} className={`transition-transform text-slate-400 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-sm text-slate-500 leading-relaxed">{a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-dark">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to start collecting?</h2>
          <p className="text-slate-400 mb-8 text-lg">
            Join thousands of individuals and organizations already thriving with ThriveFund.
          </p>
          <Link
            to="/signup"
            className="inline-block bg-primary text-white px-8 py-4 rounded-xl font-semibold text-base hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30"
          >
            Create Your First Goal →
          </Link>
        </div>
      </section>

      <footer className="bg-dark border-t border-white/10 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <LogoWhite size="sm" />
          <p className="text-slate-500 text-xs">© 2024 ThriveFund Technologies Ltd. All rights reserved.</p>
          <div className="flex gap-4 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
