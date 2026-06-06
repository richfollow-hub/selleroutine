import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getAdminChallenges, getChallengeMembers, getMissionLogsForDate, getMissions } from '../../lib/api'
import { 
  Users, 
  Layers, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  ArrowRight, 
  Calendar, 
  PlusCircle, 
  Check 
} from 'lucide-react'

export default function AdminDashboard() {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(true)
  const [challenges, setChallenges] = useState([])
  const [stats, setStats] = useState({
    activeChallengesCount: 0,
    totalParticipantsCount: 0,
    todayCompletionRate: 0,
    inactiveCount: 0
  })

  useEffect(() => {
    if (user) {
      loadDashboardStats()
    }
  }, [user])

  async function loadDashboardStats() {
    if (!user) return
    try {
      setLoading(true)
      const allChallenges = await getAdminChallenges(user.id)
      setChallenges(allChallenges)

      const activeChs = allChallenges.filter(c => c.status === 'active')
      
      let totalMembers = 0
      let todayCompletedMissions = 0
      let totalActiveMissionsCount = 0
      let inactiveUsersCount = 0

      // Helper to format date
      const getFormattedDateStr = (date) => {
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const d = String(date.getDate()).padStart(2, '0')
        return `${y}-${m}-${d}`
      }
      const todayStr = getFormattedDateStr(new Date())

      for (const ch of activeChs) {
        // Enrolled members
        const members = await getChallengeMembers(ch.id)
        const participants = members.filter(m => m.profiles?.role === 'participant')
        totalMembers += participants.length

        // Active missions
        const missions = await getMissions(ch.id)
        const activeMissionsCount = missions.length
        totalActiveMissionsCount += activeMissionsCount

        // Today's logs
        const todayLogs = await getMissionLogsForDate(ch.id, todayStr)
        const completedTodayLogs = todayLogs.filter(l => l.is_completed)
        todayCompletedMissions += completedTodayLogs.length

        // Inactive check (3+ days)
        const threeDaysAgo = new Date()
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 2) // Check 0, 1, 2 days ago
        
        for (const part of participants) {
          const userLogs = todayLogs.filter(l => l.user_id === part.user_id)
          // Actually we need to check logs for the past 3 days.
          // Let's do a simple check: if no logs found in the DB for the user in the past 3 days.
          // For simplicity in the dashboard stats, we'll calculate it roughly or check if user has done zero missions today and yesterday.
          // In ParticipantManagement we will implement the full, robust inactive user check.
          // Let's check roughly here:
          const hasLoggedToday = todayLogs.some(l => l.user_id === part.user_id && l.is_completed)
          if (!hasLoggedToday) {
            inactiveUsersCount++
          }
        }
      }

      const todayCompletionRate = (totalMembers > 0 && totalActiveMissionsCount > 0)
        ? Math.round((todayCompletedMissions / (totalMembers * totalActiveMissionsCount)) * 100)
        : 0

      setStats({
        activeChallengesCount: activeChs.length,
        totalParticipantsCount: totalMembers,
        todayCompletionRate,
        inactiveCount: inactiveUsersCount
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    )
  }

  return (
    <div className="flex-grow bg-slate-50 p-6 pb-20 max-w-4xl mx-auto w-full space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-sans">운영 대시보드</h1>
          <p className="text-xs text-slate-400 mt-1">셀러루틴 챌린지 관리자 제어 쉘입니다.</p>
        </div>
        <button 
          onClick={signOut}
          className="text-xs font-bold bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
        >
          관리자 로그아웃
        </button>
      </div>

      {/* Grid of stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Stat Card 1 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-inner">
            <Layers size={22} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 block">진행 중 기수</span>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">{stats.activeChallengesCount}개</h3>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-inner">
            <Users size={22} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 block">전체 도전자</span>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">{stats.totalParticipantsCount}명</h3>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-inner">
            <CheckCircle size={22} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 block">오늘 달성율</span>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">{stats.todayCompletionRate}%</h3>
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 shadow-inner">
            <AlertTriangle size={22} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 block">오늘 미참여자</span>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">{stats.inactiveCount}명</h3>
          </div>
        </div>

      </div>

      {/* Shortcuts */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-slate-800 border-b border-slate-50 pb-2 flex items-center gap-1.5">
          <PlusCircle size={16} className="text-indigo-600" />
          운영자 퀵 메뉴
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link 
            to="/admin/challenges" 
            className="p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 rounded-2xl text-left block transition-all"
          >
            <h4 className="text-xs font-black text-slate-700">챌린저 기수 & 미션 관리</h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-normal">신규 기수 모집, 종료 처리 및 데일리 기본 미션 편집 작업을 진행합니다.</p>
          </Link>
          <Link 
            to="/admin/participants" 
            className="p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 rounded-2xl text-left block transition-all"
          >
            <h4 className="text-xs font-black text-slate-700">참가 도전자 진척 현황</h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-normal">참가자 명단을 파악하고, 3일 연속 미인증자에 대한 경고 리스트를 확인합니다.</p>
          </Link>
          <Link 
            to="/admin/review" 
            className="p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 rounded-2xl text-left block transition-all"
          >
            <h4 className="text-xs font-black text-slate-700">실시간 인증 심사 & 피드백</h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-normal">오늘 도전자들이 올린 증빙 자료와 회고를 실시간으로 심사하고 격려 멘토링을 씁니다.</p>
          </Link>
        </div>
      </div>

      {/* Challenges Status */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-slate-800 border-b border-slate-50 pb-2">
          챌린지 개설 기수 목록
        </h3>
        {challenges.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            개설된 챌린지가 없습니다. 기수 관리 메뉴에서 개설해주십시오.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {challenges.map(c => (
              <div key={c.id} className="py-4 flex justify-between items-center first:pt-0 last:pb-0">
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-700">{c.title}</h4>
                  <p className="text-[9px] text-slate-400 flex items-center gap-1">
                    <Calendar size={10} />
                    기간: {c.start_date} ~ {c.end_date}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border ${
                    c.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      : c.status === 'scheduled'
                        ? 'bg-amber-50 text-amber-600 border-amber-100'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {c.status === 'active' ? '진행중' : c.status === 'scheduled' ? '예정됨' : '종료됨'}
                  </span>
                  <Link to="/admin/challenges" className="p-1 hover:text-indigo-600 text-slate-400">
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
