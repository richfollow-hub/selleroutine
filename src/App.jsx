import { BrowserRouter as Router, Routes, Route, Link, Outlet, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ProtectedRoute } from './routes/ProtectedRoute'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import ResetPassword from './pages/ResetPassword'

// Participant Pages
import ParticipantDashboard from './pages/participant/ParticipantDashboard'
import MissionLogs from './pages/participant/MissionLogs'
import FeedbackList from './pages/participant/FeedbackList'
import ProductIdeas from './pages/participant/ProductIdeas'
import KeywordNotes from './pages/participant/KeywordNotes'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import ChallengeManagement from './pages/admin/ChallengeManagement'
import ParticipantManagement from './pages/admin/ParticipantManagement'
import FeedbackManagement from './pages/admin/FeedbackManagement'

// Icons
import { 
  CheckSquare, 
  Calendar, 
  Lightbulb, 
  Key, 
  MessageSquare, 
  Home, 
  Layers, 
  Users, 
  Compass,
  Briefcase
} from 'lucide-react'

import { isConfigured } from './lib/supabase'

// --- Participant Layout (With Mobile Bottom Navigation) ---
function ParticipantLayout() {
  const location = useLocation()
  
  const navItems = [
    { path: '/dashboard', label: '오늘미션', icon: CheckSquare },
    { path: '/dashboard/history', label: '인증기록', icon: Calendar },
    { path: '/dashboard/ideas', label: '아이디어', icon: Lightbulb },
    { path: '/dashboard/keywords', label: '키워드', icon: Key },
    { path: '/dashboard/feedbacks', label: '피드백', icon: MessageSquare },
  ]

  return (
    <div className="flex-grow flex flex-col min-h-screen relative bg-slate-50">
      {/* Content wrapper */}
      <div className="flex-grow flex flex-col">
        <Outlet />
      </div>

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-t border-slate-100 flex items-center justify-around px-4 z-50 shadow-lg max-w-lg mx-auto w-full rounded-t-2xl">
        {navItems.map(item => {
          const IconComponent = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                isActive 
                  ? 'text-indigo-600 font-black scale-105' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <IconComponent size={18} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
              <span className="text-[9px] mt-1 tracking-tighter">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

// --- Admin Layout (With Navigation Panel) ---
function AdminLayout() {
  const location = useLocation()
  const { profile } = useAuth()

  const adminNav = [
    { path: '/admin', label: '운영홈', icon: Home },
    { path: '/admin/challenges', label: '기수/미션', icon: Layers },
    { path: '/admin/participants', label: '참가현황', icon: Users },
    { path: '/admin/review', label: '인증검토', icon: MessageSquare },
  ]

  return (
    <div className="flex-grow min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Sidebar for desktop / Top-bar for mobile */}
      <nav className="bg-white border-b md:border-b-0 md:border-r border-slate-100 w-full md:w-60 shrink-0 p-4 flex md:flex-col justify-between z-40 shadow-sm md:h-screen sticky top-0">
        <div className="flex md:flex-col justify-between md:justify-start w-full md:space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-2 px-2">
            <Briefcase className="text-indigo-600 shrink-0" size={20} />
            <span className="font-black text-slate-800 text-sm md:text-base tracking-tight font-sans">셀러루틴 관리자</span>
          </div>

          {/* Navigation Links */}
          <div className="flex md:flex-col items-center md:items-stretch gap-1 md:gap-2">
            {adminNav.map(item => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link 
                  key={item.path} 
                  to={item.path}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <Icon size={16} />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Panel Content */}
      <div className="flex-grow overflow-y-auto md:h-screen">
        <Outlet />
      </div>
    </div>
  )
}

function MainAppRoutes() {
  const { profile } = useAuth()

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={profile ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Participant Guarded Routes */}
      <Route element={<ProtectedRoute requiredRole="participant" />}>
        <Route element={<ParticipantLayout />}>
          <Route path="/dashboard" element={<ParticipantDashboard />} />
          <Route path="/dashboard/history" element={<MissionLogs />} />
          <Route path="/dashboard/feedbacks" element={<FeedbackList />} />
          <Route path="/dashboard/ideas" element={<ProductIdeas />} />
          <Route path="/dashboard/keywords" element={<KeywordNotes />} />
        </Route>
      </Route>

      {/* Admin Guarded Routes */}
      <Route element={<ProtectedRoute requiredRole="admin" />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/challenges" element={<ChallengeManagement />} />
          <Route path="/admin/participants" element={<ParticipantManagement />} />
          <Route path="/admin/review" element={<FeedbackManagement />} />
        </Route>
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-100 shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/></svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-800">Supabase 연동이 설정되지 않았습니다</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              로컬 프로젝트 루트 폴더에 <code>.env</code> 파일을 생성하고 Supabase Project URL 및 Anon Key 환경변수를 채워주셔야 서비스가 정상 작동합니다.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl text-left text-[11px] text-slate-500 font-mono space-y-2">
            <div><strong>[설정 방법]</strong></div>
            <div>1. 프로젝트 루트에 <code>.env</code> 파일 생성</div>
            <div className="bg-white p-2.5 rounded border border-slate-200 break-all select-all">
              VITE_SUPABASE_URL=https://your-project.supabase.co<br/>
              VITE_SUPABASE_ANON_KEY=your-anon-key
            </div>
            <div>2. 변경 완료 후 로컬 서버(npm run dev) 재구동</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AuthProvider>
      <Router>
        <MainAppRoutes />
      </Router>
    </AuthProvider>
  )
}
