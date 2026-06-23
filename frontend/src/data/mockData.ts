export const formatNaira = (amount: number) =>
  '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 0 })

export const calcProgress = (raised: number, target: number) =>
  Math.min(100, Math.round((raised / target) * 100))

export interface Goal {
  id: number
  name: string
  category: string
  target: number
  raised: number
  contributors: number
  daysLeft: number
  status: 'active' | 'completed'
  color: string
}

export interface Transaction {
  id: string
  date: string
  contributor: string
  amount: number
  goal: string
  status: 'successful' | 'pending' | 'failed'
  ref: string
}

export interface Contributor {
  name: string
  email: string
  total: number
  last: string
  goals: number
  avatar: string
}

export const goals: Goal[] = [
  { id: 1, name: 'Abuja Community Water Project', category: 'Community Project', target: 5_000_000, raised: 3_250_000, contributors: 142, daysLeft: 45, status: 'active', color: '#00A86B' },
  { id: 2, name: 'Adaeze & Chukwuemeka Wedding', category: 'Wedding', target: 2_000_000, raised: 1_850_000, contributors: 67, daysLeft: 12, status: 'active', color: '#8B5CF6' },
  { id: 3, name: 'Lagos Central Mosque Renovation', category: 'Religious', target: 10_000_000, raised: 6_700_000, contributors: 389, daysLeft: 90, status: 'active', color: '#F59E0B' },
  { id: 4, name: 'UNILAG Alumni Scholarship Fund', category: 'Education', target: 3_500_000, raised: 3_500_000, contributors: 201, daysLeft: 0, status: 'completed', color: '#3B82F6' },
  { id: 5, name: 'Okafor Family Business Capital', category: 'Business', target: 8_000_000, raised: 2_100_000, contributors: 23, daysLeft: 120, status: 'active', color: '#EF4444' },
  { id: 6, name: 'St. Joseph Church Renovation', category: 'Religious', target: 4_500_000, raised: 1_200_000, contributors: 88, daysLeft: 60, status: 'active', color: '#06B6D4' },
]

export const transactions: Transaction[] = [
  { id: 'TXN-2401-001', date: 'Jan 23, 2024', contributor: 'Babatunde Adeyemi', amount: 50_000, goal: 'Abuja Community Water Project', status: 'successful', ref: 'REF-2401230001' },
  { id: 'TXN-2401-002', date: 'Jan 22, 2024', contributor: 'Chioma Nwosu', amount: 25_000, goal: 'UNILAG Alumni Scholarship Fund', status: 'successful', ref: 'REF-2401220002' },
  { id: 'TXN-2401-003', date: 'Jan 22, 2024', contributor: 'Emeka Okafor', amount: 100_000, goal: 'Lagos Central Mosque Renovation', status: 'successful', ref: 'REF-2401220003' },
  { id: 'TXN-2401-004', date: 'Jan 21, 2024', contributor: 'Fatima Aliyu', amount: 15_000, goal: 'Adaeze & Chukwuemeka Wedding', status: 'pending', ref: 'REF-2401210004' },
  { id: 'TXN-2401-005', date: 'Jan 21, 2024', contributor: 'Seun Abiodun', amount: 200_000, goal: 'Okafor Family Business Capital', status: 'successful', ref: 'REF-2401210005' },
  { id: 'TXN-2401-006', date: 'Jan 20, 2024', contributor: 'Ngozi Eze', amount: 10_000, goal: 'Abuja Community Water Project', status: 'failed', ref: 'REF-2401200006' },
  { id: 'TXN-2401-007', date: 'Jan 20, 2024', contributor: 'Kelechi Obi', amount: 75_000, goal: 'Lagos Central Mosque Renovation', status: 'successful', ref: 'REF-2401200007' },
  { id: 'TXN-2401-008', date: 'Jan 19, 2024', contributor: 'Aisha Mohammed', amount: 30_000, goal: 'St. Joseph Church Renovation', status: 'successful', ref: 'REF-2401190008' },
]

export const contributors: Contributor[] = [
  { name: 'Babatunde Adeyemi', email: 'babatunde.a@gmail.com', total: 350_000, last: 'Jan 23, 2024', goals: 3, avatar: 'BA' },
  { name: 'Chioma Nwosu', email: 'chioma.nwosu@yahoo.com', total: 225_000, last: 'Jan 22, 2024', goals: 2, avatar: 'CN' },
  { name: 'Emeka Okafor', email: 'emeka.o@hotmail.com', total: 500_000, last: 'Jan 22, 2024', goals: 1, avatar: 'EO' },
  { name: 'Fatima Aliyu', email: 'fatima.aliyu@gmail.com', total: 95_000, last: 'Jan 21, 2024', goals: 2, avatar: 'FA' },
  { name: 'Seun Abiodun', email: 'seun.a@outlook.com', total: 800_000, last: 'Jan 21, 2024', goals: 4, avatar: 'SA' },
  { name: 'Ngozi Eze', email: 'ngozi.eze@gmail.com', total: 160_000, last: 'Jan 20, 2024', goals: 3, avatar: 'NE' },
  { name: 'Kelechi Obi', email: 'kelechi.obi@yahoo.com', total: 375_000, last: 'Jan 20, 2024', goals: 2, avatar: 'KO' },
  { name: 'Aisha Mohammed', email: 'aisha.m@gmail.com', total: 120_000, last: 'Jan 19, 2024', goals: 1, avatar: 'AM' },
]

export const monthlyContributions = [
  { month: 'Aug', amount: 1_200_000 },
  { month: 'Sep', amount: 1_850_000 },
  { month: 'Oct', amount: 2_100_000 },
  { month: 'Nov', amount: 2_800_000 },
  { month: 'Dec', amount: 3_400_000 },
  { month: 'Jan', amount: 4_100_000 },
]

export const categoryBreakdown = [
  { name: 'Community', value: 35, color: '#00A86B' },
  { name: 'Education', value: 22, color: '#3B82F6' },
  { name: 'Religious', value: 20, color: '#F59E0B' },
  { name: 'Wedding', value: 13, color: '#8B5CF6' },
  { name: 'Business', value: 10, color: '#EF4444' },
]

export const virtualAccounts = [
  { ref: 'REF-2401230001', account: '0123456789 - First Bank', amount: 50_000, status: 'reconciled' as const, date: 'Jan 23, 2024' },
  { ref: 'REF-2401220002', account: '0234567890 - GTBank', amount: 25_000, status: 'reconciled' as const, date: 'Jan 22, 2024' },
  { ref: 'REF-2401220003', account: '0345678901 - Zenith Bank', amount: 100_000, status: 'reconciled' as const, date: 'Jan 22, 2024' },
  { ref: 'REF-2401210004', account: '0456789012 - UBA', amount: 15_000, status: 'pending' as const, date: 'Jan 21, 2024' },
  { ref: 'REF-2401210005', account: '0567890123 - Access Bank', amount: 200_000, status: 'reconciled' as const, date: 'Jan 21, 2024' },
  { ref: 'REF-2401200006', account: '0678901234 - First Bank', amount: 10_000, status: 'failed' as const, date: 'Jan 20, 2024' },
]

export const notifications = [
  { type: 'payment', title: 'Payment received', body: 'Babatunde Adeyemi contributed ₦50,000 to Abuja Community Water Project', time: '2 min ago', unread: true, color: '#00A86B' },
  { type: 'goal', title: 'Goal completed!', body: 'UNILAG Alumni Scholarship Fund has reached its target of ₦3,500,000', time: '1 hour ago', unread: true, color: '#3B82F6' },
  { type: 'contributor', title: 'New contributor joined', body: 'Seun Abiodun just joined and contributed to Okafor Family Business Capital', time: '3 hours ago', unread: true, color: '#8B5CF6' },
  { type: 'reminder', title: 'Goal deadline approaching', body: 'Adaeze & Chukwuemeka Wedding goal ends in 12 days. ₦150,000 remaining.', time: 'Yesterday', unread: false, color: '#F59E0B' },
  { type: 'payment', title: 'Payment received', body: 'Chioma Nwosu contributed ₦25,000 to UNILAG Alumni Scholarship Fund', time: '2 days ago', unread: false, color: '#00A86B' },
  { type: 'system', title: 'Virtual account verified', body: 'Your virtual account for Lagos Central Mosque Renovation has been activated', time: '3 days ago', unread: false, color: '#64748B' },
]

export const faqs = [
  { q: 'How do virtual accounts work?', a: 'Each goal you create is assigned a unique bank account number from our partner banks. Any transfer to that account is automatically credited to your goal.' },
  { q: 'What banks are supported?', a: 'We currently support First Bank, GTBank, Zenith Bank, UBA, and Access Bank, with more being added regularly.' },
  { q: 'Are there fees?', a: 'ThriveFund charges a 1.5% transaction fee on each contribution, capped at ₦2,000. There are no monthly subscription fees.' },
  { q: 'Can contributors pay anonymously?', a: 'Yes! Contributors can choose to display their name publicly or contribute anonymously.' },
  { q: 'How secure is ThriveFund?', a: 'We use bank-grade 256-bit encryption and are compliant with CBN regulations and PCI-DSS standards.' },
]

export const testimonials = [
  { name: 'Oluwaseun Balogun', role: 'Mosque Treasurer', quote: "ThriveFund transformed how we collect for Jumu'ah and renovations. Every kobo is accounted for.", avatar: 'OB' },
  { name: 'Chidinma Okereke', role: 'Wedding Planner', quote: "My clients use ThriveFund for wedding contributions. It's seamless, beautiful, and so professional.", avatar: 'CO' },
  { name: 'Adaora Nzeocha', role: 'School Bursar', quote: 'We collect PTA dues, levies and donations all through ThriveFund. Reconciliation is instant.', avatar: 'AN' },
]

export const features = [
  { title: 'Create Goals', desc: 'Set savings goals for any purpose — weddings, school fees, community projects, or business capital.' },
  { title: 'Virtual Accounts', desc: 'Every goal gets a dedicated virtual bank account. Contributors pay directly and funds are tracked automatically.' },
  { title: 'Auto Reconciliation', desc: 'Payments are matched to goals in real-time. No manual tracking, no spreadsheets, no errors.' },
  { title: 'Invite Contributors', desc: 'Share a link, QR code, or send email invitations. Accept contributions from anyone, anywhere.' },
  { title: 'Rich Analytics', desc: 'Monitor contribution trends, top donors, goal performance, and more from a beautiful dashboard.' },
  { title: 'Bank-Grade Security', desc: 'All transactions are encrypted and secured. Your funds are protected at every step.' },
]

export const howItWorks = [
  { n: '01', title: 'Create a Goal', desc: 'Name your goal, set a target, choose a category and deadline.' },
  { n: '02', title: 'Get Your Account', desc: 'Receive a dedicated virtual bank account number instantly.' },
  { n: '03', title: 'Share & Collect', desc: 'Send your account details or link to contributors worldwide.' },
  { n: '04', title: 'Track Everything', desc: 'Watch contributions roll in and reconcile automatically.' },
]
