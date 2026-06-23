import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Building2, RefreshCw, Shield } from 'lucide-react'
import { Logo } from '../components/ui'

interface AuthPageProps {
  mode: 'login' | 'signup'
}

export default function AuthPage({ mode }: AuthPageProps) {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = () => navigate('/dashboard')

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="hidden lg:flex flex-col bg-dark w-[420px] flex-shrink-0 p-10">
        <div className="flex items-center gap-2.5 mb-auto">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg">ThriveFund</span>
        </div>
        <div className="mb-auto">
          <h2 className="text-3xl font-bold text-white mb-4">Start collecting contributions today.</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Join thousands of Nigerians who use ThriveFund to raise funds for goals that matter.
          </p>
          <div className="mt-8 space-y-4">
            {[
              { icon: Building2, text: 'Dedicated virtual bank accounts for every goal' },
              { icon: RefreshCw, text: 'Automatic payment reconciliation' },
              { icon: Shield, text: 'CBN-compliant and fully secure' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-slate-300">
                <div className="w-7 h-7 bg-primary/15 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-primary" />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold text-dark mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm text-slate-500 mb-8">
            {mode === 'login' ? 'Sign in to access your dashboard' : 'Get started free — no credit card required'}
          </p>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-5">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Full Name</label>
                <input
                  placeholder="Adebayo Okonkwo"
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {mode === 'login' && (
                <button className="text-xs text-primary font-medium mt-1.5 hover:underline">Forgot password?</button>
              )}
            </div>
            <button
              onClick={handleSubmit}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors mt-2"
            >
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <Link
              to={mode === 'login' ? '/signup' : '/login'}
              className="text-primary font-semibold hover:underline"
            >
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
