import type {
  AdminStats,
  Campaign,
  Contributor,
  DashboardStats,
  Invitation,
  MonthlyCollection,
  Organization,
  ReconciliationOverview,
  ReconciliationRecord,
  Report,
  Transaction,
  VirtualAccount,
} from '@/types';

export const MOCK_MODE = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false';

export const organizations: Organization[] = [
  {
    id: 'org-001',
    name: 'Greenfield Academy',
    type: 'school',
    description: 'Private secondary school in Abuja collecting tuition and PTA levies.',
    email: 'bursar@greenfield.edu.ng',
    phone: '08031234567',
    address: '12 Maitama Crescent, Abuja',
    campaignsCount: 4,
    totalCollected: 18_450_000,
    membersCount: 312,
    createdAt: '2025-09-01',
  },
  {
    id: 'org-002',
    name: 'Lagos Central Mosque',
    type: 'mosque',
    description: 'Community mosque managing Jumu\'ah collections and renovation funds.',
    email: 'treasurer@lagoscentralmosque.org',
    phone: '08087654321',
    address: '45 Broad Street, Lagos Island',
    campaignsCount: 3,
    totalCollected: 12_700_000,
    membersCount: 890,
    createdAt: '2024-11-15',
  },
  {
    id: 'org-003',
    name: 'St. Joseph Catholic Church',
    type: 'church',
    description: 'Parish collections for building fund and welfare programmes.',
    email: 'finance@stjosephchurch.ng',
    phone: '08099887766',
    address: '8 Ogui Road, Enugu',
    campaignsCount: 2,
    totalCollected: 4_200_000,
    membersCount: 456,
    createdAt: '2025-01-20',
  },
  {
    id: 'org-004',
    name: 'Lagos Cooperative Thrift Society',
    type: 'cooperative',
    description: 'Monthly dues and loan repayments for cooperative members.',
    email: 'secretary@lagosthrift.coop',
    phone: '08123456789',
    address: '22 Allen Avenue, Ikeja',
    campaignsCount: 2,
    totalCollected: 8_900_000,
    membersCount: 128,
    createdAt: '2025-03-10',
  },
  {
    id: 'org-005',
    name: 'UNILAG Alumni Association',
    type: 'association',
    description: 'Alumni levies, scholarship drives, and reunion payments.',
    email: 'treasury@unilagalumni.org',
    phone: '08055667788',
    address: 'University of Lagos, Akoka',
    campaignsCount: 3,
    totalCollected: 6_350_000,
    membersCount: 1204,
    createdAt: '2024-06-01',
  },
];

export const campaigns: Campaign[] = [
  {
    id: 'camp-001',
    slug: 'greenfield-term-2-tuition',
    organizationId: 'org-001',
    organizationName: 'Greenfield Academy',
    name: 'Term 2 Tuition Collection 2025/26',
    type: 'tuition',
    category: 'Education',
    target: 25_000_000,
    raised: 18_450_000,
    contributors: 142,
    daysLeft: 18,
    status: 'active',
    description: 'Second term tuition for JSS and SSS students. Pay via dedicated virtual account.',
    shareLink: 'https://thrivefund.ng/c/greenfield-term-2-tuition',
    virtualAccountId: 'va-001',
    createdAt: '2026-01-05',
  },
  {
    id: 'camp-002',
    slug: 'lagos-mosque-renovation',
    organizationId: 'org-002',
    organizationName: 'Lagos Central Mosque',
    name: 'Mosque Renovation Fund',
    type: 'project_fundraising',
    category: 'Religious',
    target: 10_000_000,
    raised: 6_700_000,
    contributors: 389,
    daysLeft: 45,
    status: 'active',
    description: 'Renovation of prayer hall, ablution area, and parking expansion.',
    shareLink: 'https://thrivefund.ng/c/lagos-mosque-renovation',
    virtualAccountId: 'va-002',
    createdAt: '2025-11-01',
  },
  {
    id: 'camp-003',
    slug: 'cooperative-monthly-dues',
    organizationId: 'org-004',
    organizationName: 'Lagos Cooperative Thrift Society',
    name: 'June 2026 Monthly Dues',
    type: 'membership_dues',
    category: 'Cooperative',
    target: 2_000_000,
    raised: 1_680_000,
    contributors: 84,
    daysLeft: 5,
    status: 'active',
    description: 'Monthly cooperative contribution — ₦20,000 per member.',
    shareLink: 'https://thrivefund.ng/c/cooperative-monthly-dues',
    virtualAccountId: 'va-003',
    createdAt: '2026-06-01',
  },
  {
    id: 'camp-004',
    slug: 'unilag-scholarship-fund',
    organizationId: 'org-005',
    organizationName: 'UNILAG Alumni Association',
    name: 'Alumni Scholarship Fund 2026',
    type: 'contribution',
    category: 'Education',
    target: 5_000_000,
    raised: 5_000_000,
    contributors: 201,
    daysLeft: 0,
    status: 'completed',
    description: 'Supporting indigent students with tuition and materials.',
    shareLink: 'https://thrivefund.ng/c/unilag-scholarship-fund',
    virtualAccountId: 'va-004',
    createdAt: '2025-08-15',
  },
  {
    id: 'camp-005',
    slug: 'st-joseph-building-fund',
    organizationId: 'org-003',
    organizationName: 'St. Joseph Catholic Church',
    name: 'Parish Building Fund',
    type: 'project_fundraising',
    category: 'Religious',
    target: 4_500_000,
    raised: 1_200_000,
    contributors: 88,
    daysLeft: 60,
    status: 'active',
    description: 'Expansion of parish hall and youth centre.',
    shareLink: 'https://thrivefund.ng/c/st-joseph-building-fund',
    virtualAccountId: 'va-005',
    createdAt: '2026-02-01',
  },
  {
    id: 'camp-006',
    slug: 'tech-summit-2026',
    organizationId: 'org-001',
    organizationName: 'Greenfield Academy',
    name: 'Annual Tech Summit Registration',
    type: 'event_payment',
    category: 'Events',
    target: 1_500_000,
    raised: 890_000,
    contributors: 67,
    daysLeft: 22,
    status: 'active',
    description: 'Registration fees for Greenfield Annual Tech Summit 2026.',
    shareLink: 'https://thrivefund.ng/c/tech-summit-2026',
    virtualAccountId: 'va-006',
    createdAt: '2026-04-01',
  },
];

export const virtualAccounts: VirtualAccount[] = [
  {
    id: 'va-001',
    accountNumber: '9012345678',
    bankName: 'First Bank',
    accountName: 'ThriveFund/Greenfield Term2',
    campaignId: 'camp-001',
    campaignName: 'Term 2 Tuition Collection 2025/26',
    organizationName: 'Greenfield Academy',
    status: 'active',
    createdAt: '2026-01-05',
  },
  {
    id: 'va-002',
    accountNumber: '9023456789',
    bankName: 'GTBank',
    accountName: 'ThriveFund/Lagos Mosque Reno',
    campaignId: 'camp-002',
    campaignName: 'Mosque Renovation Fund',
    organizationName: 'Lagos Central Mosque',
    status: 'active',
    createdAt: '2025-11-01',
  },
  {
    id: 'va-003',
    accountNumber: '9034567890',
    bankName: 'Zenith Bank',
    accountName: 'ThriveFund/Lagos Coop Dues',
    campaignId: 'camp-003',
    campaignName: 'June 2026 Monthly Dues',
    organizationName: 'Lagos Cooperative Thrift Society',
    status: 'active',
    createdAt: '2026-06-01',
  },
  {
    id: 'va-004',
    accountNumber: '9045678901',
    bankName: 'UBA',
    accountName: 'ThriveFund/UNILAG Scholarship',
    campaignId: 'camp-004',
    campaignName: 'Alumni Scholarship Fund 2026',
    organizationName: 'UNILAG Alumni Association',
    status: 'active',
    createdAt: '2025-08-15',
  },
  {
    id: 'va-005',
    accountNumber: '9056789012',
    bankName: 'Access Bank',
    accountName: 'ThriveFund/St Joseph Building',
    campaignId: 'camp-005',
    campaignName: 'Parish Building Fund',
    organizationName: 'St. Joseph Catholic Church',
    status: 'active',
    createdAt: '2026-02-01',
  },
  {
    id: 'va-006',
    accountNumber: '9067890123',
    bankName: 'First Bank',
    accountName: 'ThriveFund/Tech Summit 2026',
    campaignId: 'camp-006',
    campaignName: 'Annual Tech Summit Registration',
    organizationName: 'Greenfield Academy',
    status: 'pending',
    createdAt: '2026-04-01',
  },
];

export const transactions: Transaction[] = [
  { id: 'txn-001', reference: 'REF-2606280001', payer: 'Babatunde Adeyemi', amount: 150_000, campaignId: 'camp-001', campaignName: 'Term 2 Tuition Collection 2025/26', organizationId: 'org-001', organizationName: 'Greenfield Academy', status: 'successful', date: '2026-06-28', reconciliationStatus: 'matched' },
  { id: 'txn-002', reference: 'REF-2606270002', payer: 'Chioma Nwosu', amount: 50_000, campaignId: 'camp-002', campaignName: 'Mosque Renovation Fund', organizationId: 'org-002', organizationName: 'Lagos Central Mosque', status: 'successful', date: '2026-06-27', reconciliationStatus: 'matched' },
  { id: 'txn-003', reference: 'REF-2606270003', payer: 'Emeka Okafor', amount: 20_000, campaignId: 'camp-003', campaignName: 'June 2026 Monthly Dues', organizationId: 'org-004', organizationName: 'Lagos Cooperative Thrift Society', status: 'successful', date: '2026-06-27', reconciliationStatus: 'matched' },
  { id: 'txn-004', reference: 'REF-2606260004', payer: 'Fatima Aliyu', amount: 75_000, campaignId: 'camp-001', campaignName: 'Term 2 Tuition Collection 2025/26', organizationId: 'org-001', organizationName: 'Greenfield Academy', status: 'pending', date: '2026-06-26', reconciliationStatus: 'pending_review' },
  { id: 'txn-005', reference: 'REF-2606260005', payer: 'Seun Abiodun', amount: 100_000, campaignId: 'camp-002', campaignName: 'Mosque Renovation Fund', organizationId: 'org-002', organizationName: 'Lagos Central Mosque', status: 'successful', date: '2026-06-26', reconciliationStatus: 'matched' },
  { id: 'txn-006', reference: 'REF-2606250006', payer: 'Unknown Payer', amount: 35_000, campaignId: 'camp-005', campaignName: 'Parish Building Fund', organizationId: 'org-003', organizationName: 'St. Joseph Catholic Church', status: 'successful', date: '2026-06-25', reconciliationStatus: 'unmatched' },
  { id: 'txn-007', reference: 'REF-2606250007', payer: 'Ngozi Eze', amount: 20_000, campaignId: 'camp-003', campaignName: 'June 2026 Monthly Dues', organizationId: 'org-004', organizationName: 'Lagos Cooperative Thrift Society', status: 'successful', date: '2026-06-25', reconciliationStatus: 'duplicate' },
  { id: 'txn-008', reference: 'REF-2606240008', payer: 'Kelechi Obi', amount: 250_000, campaignId: 'camp-004', campaignName: 'Alumni Scholarship Fund 2026', organizationId: 'org-005', organizationName: 'UNILAG Alumni Association', status: 'successful', date: '2026-06-24', reconciliationStatus: 'matched' },
  { id: 'txn-009', reference: 'REF-2606240009', payer: 'Aisha Mohammed', amount: 15_000, campaignId: 'camp-006', campaignName: 'Annual Tech Summit Registration', organizationId: 'org-001', organizationName: 'Greenfield Academy', status: 'failed', date: '2026-06-24', reconciliationStatus: 'unmatched' },
  { id: 'txn-010', reference: 'REF-2606230010', payer: 'Oluwaseun Balogun', amount: 500_000, campaignId: 'camp-002', campaignName: 'Mosque Renovation Fund', organizationId: 'org-002', organizationName: 'Lagos Central Mosque', status: 'successful', date: '2026-06-23', reconciliationStatus: 'matched' },
];

export const contributors: Contributor[] = [
  { id: 'mem-001', name: 'Babatunde Adeyemi', email: 'babatunde.a@gmail.com', phone: '08031234567', organizationId: 'org-001', totalPaid: 450_000, outstanding: 50_000, lastPayment: '2026-06-28', paymentStatus: 'partial', campaigns: ['Term 2 Tuition'] },
  { id: 'mem-002', name: 'Chioma Nwosu', email: 'chioma.nwosu@yahoo.com', phone: '08087654321', organizationId: 'org-002', totalPaid: 225_000, outstanding: 0, lastPayment: '2026-06-27', paymentStatus: 'paid', campaigns: ['Mosque Renovation'] },
  { id: 'mem-003', name: 'Emeka Okafor', email: 'emeka.o@hotmail.com', phone: '08123456789', organizationId: 'org-004', totalPaid: 120_000, outstanding: 0, lastPayment: '2026-06-27', paymentStatus: 'paid', campaigns: ['Monthly Dues'] },
  { id: 'mem-004', name: 'Fatima Aliyu', email: 'fatima.aliyu@gmail.com', phone: '08099887766', organizationId: 'org-001', totalPaid: 300_000, outstanding: 200_000, lastPayment: '2026-06-26', paymentStatus: 'partial', campaigns: ['Term 2 Tuition'] },
  { id: 'mem-005', name: 'Seun Abiodun', email: 'seun.a@outlook.com', phone: '08055667788', organizationId: 'org-002', totalPaid: 800_000, outstanding: 0, lastPayment: '2026-06-26', paymentStatus: 'overpaid', campaigns: ['Mosque Renovation'] },
  { id: 'mem-006', name: 'Ngozi Eze', email: 'ngozi.eze@gmail.com', phone: '08166778899', organizationId: 'org-004', totalPaid: 40_000, outstanding: 0, lastPayment: '2026-06-25', paymentStatus: 'paid', campaigns: ['Monthly Dues'] },
  { id: 'mem-007', name: 'Kelechi Obi', email: 'kelechi.obi@yahoo.com', phone: '08077889900', organizationId: 'org-005', totalPaid: 375_000, outstanding: 125_000, lastPayment: '2026-06-24', paymentStatus: 'partial', campaigns: ['Scholarship Fund'] },
  { id: 'mem-008', name: 'Aisha Mohammed', email: 'aisha.m@gmail.com', phone: '08088990011', organizationId: 'org-001', totalPaid: 0, outstanding: 15_000, lastPayment: null, paymentStatus: 'outstanding', campaigns: ['Tech Summit'] },
];

export const reconciliationRecords: ReconciliationRecord[] = transactions.map((t) => ({
  id: `rec-${t.id}`,
  reference: t.reference,
  payer: t.payer,
  amount: t.amount,
  campaignName: t.campaignName,
  organizationName: t.organizationName,
  status: t.reconciliationStatus,
  receivedAt: t.date,
  matchedAt: t.reconciliationStatus === 'matched' ? t.date : null,
  notes: t.reconciliationStatus === 'unmatched' ? 'Payer name does not match any contributor record' : undefined,
}));

export const reconciliationOverview: ReconciliationOverview = {
  incoming: 1247,
  matched: 1189,
  unmatched: 32,
  duplicate: 14,
  pendingReview: 12,
  accuracy: 95.3,
};

export const dashboardStats: DashboardStats = {
  totalCollected: 42_840_000,
  activeCampaigns: 5,
  contributors: 971,
  pendingReconciliation: 44,
  reconciliationAccuracy: 95.3,
};

export const adminStats: AdminStats = {
  totalUsers: 2847,
  totalOrganizations: 412,
  totalCampaigns: 1836,
  totalTransactions: 48_291,
  totalVolume: 2_847_000_000,
  activeVirtualAccounts: 1654,
};

export const monthlyCollections: MonthlyCollection[] = [
  { month: 'Jan', amount: 2_400_000 },
  { month: 'Feb', amount: 3_100_000 },
  { month: 'Mar', amount: 3_800_000 },
  { month: 'Apr', amount: 4_200_000 },
  { month: 'May', amount: 5_600_000 },
  { month: 'Jun', amount: 6_740_000 },
];

export const reports: Report[] = [
  { id: 'rpt-001', title: 'Payment Summary — June 2026', description: 'All successful payments across organizations', type: 'payment_summary', format: 'pdf', generatedAt: '2026-06-28', size: '245 KB' },
  { id: 'rpt-002', title: 'Outstanding Contributors Report', description: 'Members with unpaid or partial balances', type: 'outstanding', format: 'xlsx', generatedAt: '2026-06-27', size: '128 KB' },
  { id: 'rpt-003', title: 'Campaign Performance Q2 2026', description: 'Target vs collected by campaign', type: 'campaign_performance', format: 'pdf', generatedAt: '2026-06-25', size: '312 KB' },
  { id: 'rpt-004', title: 'Monthly Collection Report — May 2026', description: 'Daily breakdown of incoming transfers', type: 'monthly_collection', format: 'csv', generatedAt: '2026-06-01', size: '89 KB' },
];

export const invitations: Invitation[] = [
  { id: 'inv-001', email: 'new.member@email.com', name: 'Tunde Williams', campaignName: 'Term 2 Tuition Collection 2025/26', status: 'sent', sentAt: '2026-06-26' },
  { id: 'inv-002', email: 'chioma.parent@gmail.com', name: 'Chioma Parent', campaignName: 'Term 2 Tuition Collection 2025/26', status: 'accepted', sentAt: '2026-06-20' },
  { id: 'inv-003', email: 'pending@example.com', name: 'Pending Member', campaignName: 'June 2026 Monthly Dues', status: 'pending', sentAt: '2026-06-28' },
];

export const useCases = [
  { title: 'School Fees', desc: 'Collect term fees, PTA levies, and exam charges with automatic reconciliation.', icon: 'GraduationCap' },
  { title: 'Mosque & Church Donations', desc: 'Dedicated accounts for tithes, offerings, and building funds.', icon: 'Landmark' },
  { title: 'Cooperative Dues', desc: 'Track monthly member contributions and loan repayments.', icon: 'Users' },
  { title: 'Alumni Levies', desc: 'Association dues, reunion payments, and scholarship drives.', icon: 'Award' },
  { title: 'Event Payments', desc: 'Registration fees, ticket sales, and vendor deposits.', icon: 'Calendar' },
  { title: 'NGO Fundraising', desc: 'Project campaigns with transparent reporting for donors.', icon: 'Heart' },
  { title: 'Community Projects', desc: 'Neighbourhood levies, borehole projects, and estate dues.', icon: 'Building2' },
];

export const orgTypeLabels: Record<string, string> = {
  school: 'School',
  mosque: 'Mosque',
  church: 'Church',
  cooperative: 'Cooperative',
  association: 'Association',
  ngo: 'NGO',
  business: 'Business',
  event_organizer: 'Event Organizer',
};

export const campaignTypeLabels: Record<string, string> = {
  contribution: 'Contribution Campaign',
  membership_dues: 'Membership Dues',
  tuition: 'Tuition Collection',
  event_payment: 'Event Payment',
  project_fundraising: 'Project Fundraising',
};

export function getCampaignBySlug(slug: string) {
  return campaigns.find((c) => c.slug === slug);
}

export function getCampaignById(id: string) {
  return campaigns.find((c) => c.id === id);
}

export function getVirtualAccountByCampaignId(campaignId: string) {
  return virtualAccounts.find((va) => va.campaignId === campaignId);
}

export function getTransactionsByCampaignId(campaignId: string) {
  return transactions.filter((t) => t.campaignId === campaignId);
}

export function getContributorsByCampaignId(campaignId: string) {
  const campaign = getCampaignById(campaignId);
  if (!campaign) return [];
  return contributors.filter((c) => c.organizationId === campaign.organizationId);
}
