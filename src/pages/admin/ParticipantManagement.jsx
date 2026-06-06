import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { 
  getChallenges, 
  getChallengeMembers, 
  getParticipantLogs, 
  getMissions 
} from '../../lib/api'
import { 
  Users, 
  AlertTriangle, 
  Calendar, 
  Loader2, 
  Search, 
  Award, 
  TrendingUp, 
  Layers, 
  TrendingDown 
} from 'lucide-react'

export default function ParticipantManagement() {
  const [loading, setLoading] = useState(true)
  const [challenges, setChallenges] = useState([])
  const [selectedChallenge, setSelectedChallenge] = useState(null)
  const [participants, setParticipants] = useState([])
  const [missions, setMissions] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  // Map of participant ID -> stats
  const [participantStats, setParticipantStats] = useState({})

  useEffect(() => {
    loadInitData()
  }, [])

  async function loadInitData() {
    try {
      setLoading(true)
      const allChallenges = await getChallenges()
      setChallenges(allChallenges)
      
      const activeCh = allChallenges.find(c => c.status === 'active') || allChallenges[0]
      if (activeCh) {
        await handleSelectChallenge(activeCh)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectChallenge = async (challenge) => {
    setSelectedChallenge(challenge)
    try {
      setLoading(true)
      // Get members
      const members = await getChallengeMembers(challenge.id)
      const parts = members.filter(m => m.profiles?.role === 'participant')
      setParticipants(parts)

      // Get missions
      const activeMissions = await getMissions(challenge.id)
      setMissions(activeMissions)

      // Calculate stats for each participant
      const statsMap = {}
      for (const p of parts) {
        const logs = await getParticipantLogs(p.user_id, challenge.id)
        
        // 1. Cumulative completions
        const totalCompleted = logs.filter(l => l.is_completed).length

        // 2. Weekly average score
        const getFormattedDateStr = (date) => {
          const y = date.getFullYear()
          const m = String(date.getMonth() + 1).padStart(2, '0')
          const d = String(date.getDate()).padStart(2, '0')
          return `${y}-${m}-${d}`
        }

        const getWeekDates = (baseDateStr) => {
          const baseDate = new Date(baseDateStr)
          const day = baseDate.getDay()
          const adjusted = day === 0 ? 6 : day - 1
          const monday = new Date(baseDate)
          monday.setDate(baseDate.getDate() - adjusted)
          const week = []
          for (let i = 0; i < 7; i++) {
            const dayVal = new Date(monday)
            dayVal.setDate(monday.getDate() + i)
            week.push(dayVal)
          }
          return week
        }

        const today = new Date()
        today.setHours(0,0,0,0)
        const weekDays = getWeekDates(getFormattedDateStr(today))
        let evaluatedDays = 0
        let progressSum = 0

        weekDays.forEach(date => {
          if (date <= today) {
            const dateStr = getFormattedDateStr(date)
            const completedCount = logs.filter(l => l.log_date === dateStr && l.is_completed).length
            progressSum += activeMissions.length > 0 ? (completedCount / activeMissions.length) * 100 : 0
            evaluatedDays++
          }
        })
        const weeklyScore = evaluatedDays > 0 ? Math.round(progressSum / evaluatedDays) : 0

        // 3. Inactive check (3+ consecutive days including today, yesterday, 2 days ago)
        const getPastDateStr = (offset) => {
          const d = new Date()
          d.setDate(d.getDate() - offset)
          return getFormattedDateStr(d)
        }
        
        const last3Days = [getPastDateStr(0), getPastDateStr(1), getPastDateStr(2)]
        const hasDoneSomething = logs.some(l => last3Days.includes(l.log_date) && l.is_completed)
        const isInactive = !hasDoneSomething

        statsMap[p.user_id] = {
          totalCompleted,
          weeklyScore,
          isInactive
        }
      }

      setParticipantStats(statsMap)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      const name = p.profiles?.name || ''
      const email = p.profiles?.email || ''
      return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             email.toLowerCase().includes(searchQuery.toLowerCase())
    })
  }, [participants, searchQuery])

  // Count warning users
  const warningCount = useMemo(() => {
    return Object.values(participantStats).filter(s => s.isInactive).length
  }, [participantStats])

  if (loading && challenges.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    )
  }

  return (
    <div className="flex-grow bg-slate-50 p-6 pb-20 max-w-4xl mx-auto w-full space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 font-sans">
            <Users size={22} className="text-indigo-600" />
            참가 도전자 관리
          </h2>
          <p className="text-xs text-slate-400 mt-1">도전자들의 실천 스코어와 3일 연속 미인증 케어 보드입니다.</p>
        </div>

        {/* Challenge Switcher */}
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-slate-400" />
          <select 
            value={selectedChallenge?.id || ''} 
            onChange={(e) => {
              const target = challenges.find(c => c.id === e.target.value)
              if (target) handleSelectChallenge(target)
            }}
            className="text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-black text-slate-700"
          >
            {challenges.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Warning Panel */}
      {warningCount > 0 && (
        <div className="bg-rose-50 border border-rose-100 rounded-3xl p-5 flex gap-4 items-start text-left animate-fade-in">
          <div className="p-2 bg-rose-100 text-rose-600 rounded-2xl shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black text-rose-800">3일 연속 미인증 경보가 울렸습니다!</h4>
            <p className="text-[10px] text-rose-600 leading-normal font-medium">
              오늘을 포함한 최근 3일간 어떠한 의무 루틴도 수행하지 않은 이탈 위험군이 총 {warningCount}명 감지되었습니다. 운영자는 일지를 검토하고 신속히 멘토링 피드백을 전달하여 완주를 도와주세요.
            </p>
          </div>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="도전자명 또는 이메일 검색..." 
            className="w-full text-xs pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
          />
        </div>
        <div className="text-[10px] text-slate-400 font-bold shrink-0">
          현재 기수 참가자: {participants.length}명 / 검색됨: {filteredParticipants.length}명
        </div>
      </div>

      {/* Participants Table List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
        
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <Loader2 className="animate-spin text-indigo-600" size={24} />
            <span className="text-xs text-slate-400">데이터를 로드하는 중...</span>
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white">
            검색 결과에 매칭되는 도전자가 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-extrabold uppercase">
                  <th className="p-4 pl-6">성명 (이메일)</th>
                  <th className="p-4 text-center">이번주 주간 점수</th>
                  <th className="p-4 text-center">누적 미션 성공</th>
                  <th className="p-4 text-center">이탈 위험 관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredParticipants.map(p => {
                  const stat = participantStats[p.user_id] || { totalCompleted: 0, weeklyScore: 0, isInactive: false }
                  
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="p-4 pl-6">
                        <div>
                          <span className="font-black text-slate-800">{p.profiles?.name}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{p.profiles?.email}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <TrendingUp size={12} className={stat.weeklyScore >= 70 ? 'text-emerald-500' : 'text-slate-400'} />
                          <span className="font-extrabold text-slate-800">{stat.weeklyScore}점</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1 bg-indigo-50/30 border border-indigo-100/30 px-2 py-0.5 rounded-lg">
                          <Award size={11} className="text-indigo-500" />
                          <span className="font-black text-indigo-600">{stat.totalCompleted}회</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {stat.isInactive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-black rounded-full bg-rose-50 text-rose-600 border border-rose-100 animate-pulse">
                            🚨 3일 이상 미인증
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-black rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                            ✓ 양호
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  )
}
