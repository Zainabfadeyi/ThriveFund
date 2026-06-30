import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Heart,
  Landmark,
  RefreshCw,
  Shield,
  Target,
  Users,
  Award,
  CreditCard,
  BarChart3,
} from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCases } from '@/lib/site-data';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap,
  Landmark,
  Users,
  Award,
  Calendar,
  Heart,
  Building2,
};

const features = [
  { icon: Target, title: 'Payment Campaigns', desc: 'Create tuition, dues, donations, and event payment campaigns with targets and deadlines.' },
  { icon: CreditCard, title: 'Dedicated Virtual Accounts', desc: 'Each campaign gets a unique virtual account for organized bank-transfer collection.' },
  { icon: RefreshCw, title: 'Automatic Reconciliation', desc: 'Incoming bank transfers are matched to campaigns automatically — our core differentiator.' },
  { icon: Users, title: 'Contributor Management', desc: 'Track members, outstanding balances, and payment history across organizations.' },
  { icon: BarChart3, title: 'Reports & Analytics', desc: 'Download payment summaries, outstanding reports, and campaign performance.' },
  { icon: Shield, title: 'Bank-Grade Security', desc: 'Encrypted transactions and role-based access for organization admins.' },
];

const steps = [
  { n: '01', title: 'Create Organization', desc: 'Set up your school, mosque, cooperative, or NGO on ThriveFund.' },
  { n: '02', title: 'Launch Campaign', desc: 'Define a payment campaign — fees, dues, donations, or event payments.' },
  { n: '03', title: 'Get Virtual Account', desc: 'Receive a dedicated account number for contributors to pay into.' },
  { n: '04', title: 'Auto-Reconcile', desc: 'Payments are matched and recorded automatically. Review exceptions in one place.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <div className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <a href="#features" className="hover:text-thrive-dark">Features</a>
            <a href="#use-cases" className="hover:text-thrive-dark">Use Cases</a>
            <a href="#how" className="hover:text-thrive-dark">How It Works</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild><Link href="/login">Sign In</Link></Button>
            <Button asChild><Link href="/signup">Get Started</Link></Button>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#F0FDF4] via-white to-[#EFF6FF]" />
        <div className="mx-auto max-w-6xl px-6 pb-20 pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
              Payment Collection & Reconciliation for Communities and Organizations
            </div>
            <h1 className="mb-6 text-4xl font-extrabold leading-tight text-thrive-dark sm:text-5xl lg:text-6xl">
              Collect payments.{' '}
              <span className="text-primary">Reconcile automatically.</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-600">
              ThriveFund helps schools, mosques, cooperatives, NGOs, and businesses create payment campaigns,
              assign dedicated virtual accounts, and automatically reconcile incoming bank transfers — no spreadsheets required.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/signup">Start Free <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/dashboard">Open Dashboard</Link>
              </Button>
            </div>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-4">
            {[
              { label: 'Organizations', value: '412+' },
              { label: 'Auto-Match Rate', value: '95.3%' },
              { label: 'Volume Processed', value: '₦2.8B+' },
              { label: 'Virtual Accounts', value: '1,654' },
            ].map((s) => (
              <Card key={s.label} className="text-center">
                <CardContent className="p-5">
                  <p className="text-2xl font-bold text-thrive-dark">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="use-cases" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-4 text-center text-3xl font-bold text-thrive-dark">Built for every organization</h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-slate-600">
            From school bursars to mosque treasurers — ThriveFund is a fintech operations dashboard, not just a fundraising tool.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map((uc) => {
              const Icon = iconMap[uc.icon] ?? Building2;
              return (
                <Card key={uc.title} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="mb-2 font-semibold text-thrive-dark">{uc.title}</h3>
                    <p className="text-sm text-muted-foreground">{uc.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section id="features" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold text-thrive-dark">Everything you need to operate</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-thrive-dark">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="bg-thrive-dark py-20 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold">How ThriveFund works</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n}>
                <div className="mb-4 text-3xl font-bold text-primary">{s.n}</div>
                <h3 className="mb-2 font-semibold">{s.title}</h3>
                <p className="text-sm text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-bold text-thrive-dark">Ready to reconcile smarter?</h2>
          <p className="mb-8 text-slate-600">Join organizations across Nigeria using ThriveFund for payment operations.</p>
          <Button size="lg" asChild><Link href="/signup">Create Free Account</Link></Button>
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-slate-50 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <Logo />
          <p className="text-sm text-muted-foreground">© 2026 ThriveFund. {paymentModeCopy.short}.</p>
        </div>
      </footer>
    </div>
  );
}
