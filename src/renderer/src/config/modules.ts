import {
  LayoutDashboard,
  Users,
  Briefcase,
  Gavel,
  CalendarDays,
  CheckSquare,
  FileText,
  Microscope,
  BookOpen,
  FileSignature,
  ScrollText,
  Stamp,
  Landmark,
  Receipt,
  History,
  BarChart3,
  ShieldCheck,
  UserCog,
  Building2,
  Wallet,
  type LucideIcon
} from 'lucide-react'

export interface ModuleConfig {
  path: string
  label: string
  icon: LucideIcon
  /** 'built' renders the real page; 'soon' renders a generic placeholder */
  status: 'built' | 'soon'
  description?: string
  group: string
  /** Permission key (see lib/roles.ts) required to see/open this module. Omit to allow any signed-in user. */
  permission?: string
}

export const MODULE_GROUPS = ['Overview', 'Case Management', 'Documents', 'Financial', 'Admin']

export const MODULES: ModuleConfig[] = [
  // Overview
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    status: 'built',
    group: 'Overview'
  },
  {
    path: '/clients',
    label: 'Clients',
    icon: Users,
    status: 'built',
    group: 'Overview',
    permission: 'view:clients'
  },

  // Case Management
  {
    path: '/cases',
    label: 'Cases',
    icon: Briefcase,
    status: 'built',
    group: 'Case Management',
    permission: 'view:cases'
  },
  {
    path: '/hearings',
    label: 'Hearings',
    icon: Gavel,
    status: 'built',
    group: 'Case Management',
    permission: 'view:cases'
  },
  {
    path: '/calendar',
    label: 'Calendar',
    icon: CalendarDays,
    status: 'built',
    group: 'Case Management',
    permission: 'view:cases'
  },
  {
    path: '/tasks',
    label: 'Tasks',
    icon: CheckSquare,
    status: 'built',
    group: 'Case Management',
    permission: 'view:cases'
  },
  {
    path: '/evidence',
    label: 'Evidence Management',
    icon: Microscope,
    status: 'built',
    group: 'Case Management',
    description: 'Track exhibits, chain of custody, and evidence files per case.',
    permission: 'view:cases'
  },
  {
    path: '/legal-research',
    label: 'Legal Research',
    icon: BookOpen,
    status: 'built',
    group: 'Case Management',
    description: 'Save jurisprudence, statutes, and research notes for quick reference.',
    permission: 'view:cases'
  },

  // Documents
  {
    path: '/documents',
    label: 'Case Documents',
    icon: FileText,
    status: 'built',
    group: 'Documents',
    permission: 'view:documents'
  },
  {
    path: '/contracts',
    label: 'Contracts',
    icon: FileSignature,
    status: 'built',
    group: 'Documents',
    description: 'Manage engagement letters and contract templates.',
    permission: 'view:documents'
  },
  {
    path: '/affidavits',
    label: 'Affidavits',
    icon: FileText,
    status: 'built',
    group: 'Documents',
    description: 'Draft and track affidavits per case.',
    permission: 'view:documents'
  },
  {
    path: '/pleadings',
    label: 'Pleadings',
    icon: ScrollText,
    status: 'built',
    group: 'Documents',
    description: 'Draft and track pleadings filed per case.',
    permission: 'view:documents'
  },
  {
    path: '/motions',
    label: 'Motions',
    icon: ScrollText,
    status: 'built',
    group: 'Documents',
    description: 'Draft and track motions filed per case.',
    permission: 'view:documents'
  },
  {
    path: '/court-orders',
    label: 'Court Orders',
    icon: Stamp,
    status: 'built',
    group: 'Documents',
    description: 'Log court orders received per case.',
    permission: 'view:documents'
  },

  // Financial
  {
    path: '/billing',
    label: 'Billing & Invoicing',
    icon: Wallet,
    status: 'built',
    group: 'Financial',
    permission: 'view:billing'
  },
  {
    path: '/trust-accounts',
    label: 'Trust Account Management',
    icon: Landmark,
    status: 'built',
    group: 'Financial',
    description: 'Track client trust fund deposits, disbursements, and balances.',
    permission: 'view:billing'
  },
  {
    path: '/expenses',
    label: 'Expense Tracking',
    icon: Receipt,
    status: 'built',
    group: 'Financial',
    description: 'Log reimbursable case expenses (filing fees, transportation, etc.).',
    permission: 'view:billing'
  },

  // Admin
  {
    path: '/audit-trail',
    label: 'Audit Trail',
    icon: History,
    status: 'built',
    group: 'Admin',
    description: 'View a log of who changed what, and when.',
    permission: 'view:reports'
  },
  {
    path: '/reports',
    label: 'Reports & Analytics',
    icon: BarChart3,
    status: 'built',
    group: 'Admin',
    description: 'Case load, revenue, and productivity reports.',
    permission: 'view:reports'
  },
  {
    path: '/role-access',
    label: 'Users & Access',
    icon: ShieldCheck,
    status: 'built',
    group: 'Admin',
    description: 'Add system users and control what each staff role can see and edit.',
    permission: 'manage:users'
  },
  {
    path: '/lawyers',
    label: 'Multi-Lawyer Support',
    icon: UserCog,
    status: 'built',
    group: 'Admin',
    description: 'Assign cases to specific handling lawyers across the firm.',
    permission: 'manage:settings'
  },
  {
    path: '/branches',
    label: 'Multi-Branch Support',
    icon: Building2,
    status: 'built',
    group: 'Admin',
    description: 'Manage clients and cases across multiple office branches.',
    permission: 'manage:settings'
  }
]
