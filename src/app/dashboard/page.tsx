'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Shield,
  Activity,
  Target,
  Zap,
  Eye,
  Clock,
  ChevronRight,
  BarChart3,
  Globe,
  Lock,
  Radio,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  User,
  Home,
  Cpu,
  Server,
  Wifi,
  Database,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────
interface SystemStatus {
  name: string;
  status: 'online' | 'warning' | 'offline';
  latency?: string;
  icon: any;
}

interface MissionLog {
  id: string;
  timestamp: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
}

interface AgentStat {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: any;
}

// ─── Mock Data ───────────────────────────────────────────────────────
const systemStatuses: SystemStatus[] = [
  { name: 'Frontend Server', status: 'online', latency: '12ms', icon: Globe },
  { name: 'Auth Service', status: 'online', latency: '45ms', icon: Lock },
  { name: 'AI Pipeline', status: 'warning', latency: '320ms', icon: Cpu },
  { name: 'Image CDN', status: 'online', latency: '8ms', icon: Server },
  { name: 'WebSocket Feed', status: 'online', latency: '22ms', icon: Wifi },
  { name: 'Asset Database', status: 'online', latency: '15ms', icon: Database },
];

const missionLogs: MissionLog[] = [
  { id: '1', timestamp: '14:32:07', type: 'success', message: 'Agent protocol initialized successfully' },
  { id: '2', timestamp: '14:31:55', type: 'info', message: 'Secure connection established via TLS 1.3' },
  { id: '3', timestamp: '14:31:42', type: 'warning', message: 'AI pipeline response time elevated (320ms)' },
  { id: '4', timestamp: '14:31:30', type: 'success', message: 'Character asset library synced — 47 assets' },
  { id: '5', timestamp: '14:31:18', type: 'info', message: 'Training module data loaded' },
  { id: '6', timestamp: '14:30:55', type: 'success', message: 'Comic engine ready — Issue #1 cached' },
  { id: '7', timestamp: '14:30:40', type: 'error', message: 'Nanon Banana API key not configured' },
  { id: '8', timestamp: '14:30:22', type: 'info', message: 'System boot sequence complete' },
];

const agentStats: AgentStat[] = [
  { label: 'Mission Readiness', value: '87%', change: '+3%', trend: 'up', icon: Target },
  { label: 'Training Modules', value: '4 / 12', change: '+1', trend: 'up', icon: Zap },
  { label: 'Assets Generated', value: '47', change: '+12', trend: 'up', icon: Activity },
  { label: 'Active Sessions', value: '1', change: '0', trend: 'neutral', icon: Eye },
];

const sitePages = [
  { name: 'Home / Landing', path: '/', status: 'live' },
  { name: 'Login Portal', path: '/login', status: 'live' },
  { name: 'Dashboard', path: '/dashboard', status: 'live' },
  { name: 'About Agent', path: '/about', status: 'planned' },
  { name: 'Training Zones', path: '/training', status: 'planned' },
  { name: 'Comic Reader', path: '/comics', status: 'planned' },
];

// ─── Component ───────────────────────────────────────────────────────
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'systems' | 'logs'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-emerald-400';
      case 'warning': return 'text-yellow-400';
      case 'offline': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const statusDot = (status: string) => {
    switch (status) {
      case 'online': return 'bg-emerald-400';
      case 'warning': return 'bg-yellow-400';
      case 'offline': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const logIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Activity className="w-4 h-4 text-cyan-400" />;
    }
  };

  const onlineCount = systemStatuses.filter(s => s.status === 'online').length;
  const totalCount = systemStatuses.length;

  return (
    <div className="min-h-screen bg-[#050810] text-white">
      {/* ─── Top Bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#050810]/90 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <Shield className="w-7 h-7 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
              <span className="font-bold tracking-widest text-sm">MAXX 006</span>
            </Link>
            <span className="text-white/20">|</span>
            <span className="text-cyan-400 font-mono text-xs tracking-wider">CONTROL DASHBOARD</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              aria-label="Refresh"
              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/"
              aria-label="Back to Site"
              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              title="Back to Site"
            >
              <Home className="w-4 h-4 text-gray-400" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2 bg-cyan-400/10 border border-cyan-400/30 rounded-lg text-cyan-400 text-xs font-mono hover:bg-cyan-400/20 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              AGENT
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ─── System Health Banner ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-transparent to-cyan-500/10 border border-emerald-500/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-400 animate-ping opacity-40" />
              </div>
              <span className="font-mono text-sm text-emerald-400">
                SYSTEMS OPERATIONAL — {onlineCount}/{totalCount} services online
              </span>
            </div>
            <span className="text-gray-500 text-xs font-mono">
              <Clock className="w-3 h-3 inline mr-1" />
              Last check: just now
            </span>
          </div>
        </motion.div>

        {/* ─── Tab Navigation ────────────────────────────────── */}
        <div className="flex gap-1 mb-8 bg-white/5 p-1 rounded-xl w-fit">
          {(['overview', 'systems', 'logs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'bg-cyan-400 text-black font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ─── OVERVIEW TAB ─────────────────────────────────── */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Agent Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {agentStats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-cyan-400/20 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <stat.icon className="w-5 h-5 text-cyan-400/60 group-hover:text-cyan-400 transition-colors" />
                      <span className={`text-xs font-mono ${
                        stat.trend === 'up' ? 'text-emerald-400' :
                        stat.trend === 'down' ? 'text-red-400' : 'text-gray-500'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                    <div className="text-2xl font-bold mb-1">{stat.value}</div>
                    <div className="text-xs text-gray-500 font-mono">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Two Column: Pages & Quick Log */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Site Pages */}
                <div className="rounded-xl bg-white/[0.03] border border-white/5 overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="font-mono text-sm text-cyan-400 tracking-wider">SITE PAGES</h3>
                    <span className="text-xs text-gray-500 font-mono">{sitePages.filter(p => p.status === 'live').length} live</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {sitePages.map((page) => (
                      <div key={page.path} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${page.status === 'live' ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                          <span className="text-sm">{page.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                            page.status === 'live' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-gray-700/30 text-gray-500'
                          }`}>
                            {page.status}
                          </span>
                          {page.status === 'live' && (
                            <Link href={page.path} className="text-cyan-400 hover:text-cyan-300">
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Log */}
                <div className="rounded-xl bg-white/[0.03] border border-white/5 overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="font-mono text-sm text-cyan-400 tracking-wider">RECENT ACTIVITY</h3>
                    <button
                      onClick={() => setActiveTab('logs')}
                      className="text-xs text-gray-500 hover:text-cyan-400 font-mono transition-colors"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="divide-y divide-white/5 max-h-[320px] overflow-y-auto">
                    {missionLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                        <div className="mt-0.5">{logIcon(log.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-300 truncate">{log.message}</p>
                          <p className="text-xs text-gray-600 font-mono mt-0.5">{log.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-8">
                <h3 className="font-mono text-sm text-gray-500 tracking-wider mb-4">QUICK ACTIONS</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Navigation items — use Link */}
                  {[
                    { label: 'View Site', href: '/', icon: Globe },
                    { label: 'Agent Login', href: '/login', icon: Lock },
                  ].map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-cyan-400/20 hover:bg-cyan-400/5 transition-all group"
                    >
                      <action.icon className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                      <span className="text-sm font-mono">{action.label}</span>
                    </Link>
                  ))}
                  {/* Non-navigation items — use button */}
                  <button
                    className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-cyan-400/20 hover:bg-cyan-400/5 transition-all group text-left"
                    disabled
                    aria-disabled="true"
                  >
                    <Settings className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                    <span className="text-sm font-mono">Settings</span>
                  </button>
                  <button
                    className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-cyan-400/20 hover:bg-cyan-400/5 transition-all group text-left"
                    onClick={() => setActiveTab('systems')}
                  >
                    <BarChart3 className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                    <span className="text-sm font-mono">System Health</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── SYSTEMS TAB ──────────────────────────────────── */}
          {activeTab === 'systems' && (
            <motion.div
              key="systems"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {systemStatuses.map((system, i) => (
                  <motion.div
                    key={system.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <system.icon className="w-6 h-6 text-gray-500" />
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${statusDot(system.status)}`} />
                        <span className={`text-xs font-mono uppercase ${statusColor(system.status)}`}>
                          {system.status}
                        </span>
                      </div>
                    </div>
                    <h4 className="font-bold text-sm mb-1">{system.name}</h4>
                    {system.latency && (
                      <p className="text-xs text-gray-500 font-mono">Latency: {system.latency}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── LOGS TAB ─────────────────────────────────────── */}
          {activeTab === 'logs' && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="rounded-xl bg-white/[0.03] border border-white/5 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5">
                  <h3 className="font-mono text-sm text-cyan-400 tracking-wider">MISSION LOG</h3>
                </div>
                <div className="divide-y divide-white/5">
                  {missionLogs.map((log, i) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-start gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <span className="text-xs text-gray-600 font-mono w-16 flex-shrink-0 pt-0.5">
                        {log.timestamp}
                      </span>
                      <div className="mt-0.5">{logIcon(log.type)}</div>
                      <p className="text-sm text-gray-300">{log.message}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-white/5 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xs text-gray-600 font-mono">MUSTANG MAXX 006 — Control Dashboard v1.0</span>
          <span className="text-xs text-gray-600 font-mono">Next.js 14 • React 18 • TailwindCSS</span>
        </div>
      </footer>
    </div>
  );
}
