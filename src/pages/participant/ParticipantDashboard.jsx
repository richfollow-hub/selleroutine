import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { 
  getChallenges, 
  getMissions, 
  getParticipantLogs, 
  getUserChallengeMemberships, 
  joinChallenge, 
  upsertMissionLog, 
  getFeedbacksForParticipant,
  uploadProofImage
} from '../../lib/api'
import SecureImage from '../../components/SecureImage'
import { 
  CheckCircle, 
  Calendar, 
  Edit3, 
  BookOpen, 
  Save, 
  Flame, 
  Award, 
  Layers, 
  Smile, 
  MessageSquare, 
  FileText, 
  ExternalLink, 
  Check, 
  Loader2, 
  Plus 
} from 'lucide-react'

export default function ParticipantDashboard() {
  const { user, profile, signOut } = useAuth()
  
  // States
  const [challenges, setChallenges] = useState([])
  const [activeChallenge, setActiveChallenge] = useState(null)
  const [missions, setMissions] = useState([])
  const [logs, setLogs] = useState([])
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Date State
  const [selectedDate, setSelectedDate] = useState(getTodayStr())

  // Modal / Input States
  const [selectedMission, setSelectedMission] = useState(null)
  const [note, setNote] = useState('')
  const [proofLink, setProofLink] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [reflectionText, setReflectionText] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [user])

  async function loadDashboardData() {
    try {
      setLoading(true)
      
      // 1. Fetch all challenges
      const allChallenges = await getChallenges()
      setChallenges(allChallenges)

      // 2. Fetch user's memberships in a single optimized query
      const memberships = await getUserChallengeMemberships(user.id)
      
      // Find the active challenge the user joined
      let myActiveChallenge = memberships
        .map(m => m.challenges)
        .find(ch => ch && ch.status === 'active')

      // Fallback to the first joined challenge if no active status challenge is found
      if (!myActiveChallenge && memberships.length > 0) {
        myActiveChallenge = memberships[0].challenges
      }

      if (myActiveChallenge) {
        setActiveChallenge(myActiveChallenge)
        
        // 3. Fetch missions
        const activeMissions = await getMissions(myActiveChallenge.id)
        setMissions(activeMissions)

        // 4. Fetch logs
        const userLogs = await getParticipantLogs(user.id, myActiveChallenge.id)
        setLogs(userLogs)

        // 5. Fetch feedbacks
        const userFeedbacks = await getFeedbacksForParticipant(user.id)
        setFeedbacks(userFeedbacks)
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  // --- Helper Functions ---
  function getTodayStr() {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const r = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${r}`
  }

  function getWeekDates(baseDateStr) {
    const baseDate = new Date(baseDateStr)
    const day = baseDate.getDay()
    const adjusted = day === 0 ? 6 : day - 1 // Mon = 0, Sun = 6
    
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

  const weekDates = useMemo(() => {
    return getWeekDates(selectedDate)
  }, [selectedDate])

  // --- Statistics ---
  const stats = useMemo(() => {
    if (missions.length === 0) return { todayProgress: 0, streak: 0, weeklyScore: 0, totalCount: 0 }

    const todayLogs = logs.filter(l => l.log_date === getTodayStr() && l.is_completed)
    const todayProgress = Math.round((todayLogs.length / missions.length) * 100)

    // Calculate streak
    let streak = 0
    let checkDate = new Date()
    checkDate.setHours(0,0,0,0)

    const getFormatted = (d) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const r = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${r}`
    }

    let hasCompletedToday = logs.some(l => l.log_date === getFormatted(checkDate) && l.is_completed)
    if (!hasCompletedToday) {
      checkDate.setDate(checkDate.getDate() - 1)
      const hasCompletedYesterday = logs.some(l => l.log_date === getFormatted(checkDate) && l.is_completed)
      if (!hasCompletedYesterday) streak = 0
    }

    if (hasCompletedToday || logs.some(l => l.log_date === getFormatted(checkDate) && l.is_completed)) {
      while (true) {
        const dStr = getFormatted(checkDate)
        const dayDone = logs.some(l => l.log_date === dStr && l.is_completed)
        if (dayDone) {
          streak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      }
    }

    // Weekly average score
    const weekDays = getWeekDates(getTodayStr())
    let evaluatedDays = 0
    let progressSum = 0
    const todayObj = new Date()
    todayObj.setHours(0,0,0,0)

    weekDays.forEach(date => {
      if (date <= todayObj) {
        const dateStr = getFormatted(date)
        const completedCount = logs.filter(l => l.log_date === dateStr && l.is_completed).length
        progressSum += missions.length > 0 ? (completedCount / missions.length) * 100 : 0
        evaluatedDays++
      }
    })
    const weeklyScore = evaluatedDays > 0 ? Math.round(progressSum / evaluatedDays) : 0

    // Cumulative completions
    const totalCount = logs.filter(l => l.is_completed).length

    return { todayProgress, streak, weeklyScore, totalCount }
  }, [logs, missions])

  // --- Handlers ---
  const handleJoinChallenge = async (challengeId) => {
    try {
      setSubmitting(true)
      await joinChallenge(challengeId, user.id, 'participant')
      alert('챌린지에 참여 신청되었습니다! 실천을 응원합니다! 🚀')
      await loadDashboardData()
    } catch (err) {
      alert('참여 신청 실패: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleMission = async (missionId) => {
    const existingLog = logs.find(l => l.mission_id === missionId && l.log_date === selectedDate)
    const isCompleted = existingLog ? !existingLog.is_completed : true

    try {
      const payload = {
        challenge_id: activeChallenge.id,
        mission_id: missionId,
        user_id: user.id,
        log_date: selectedDate,
        is_completed: isCompleted,
        note: existingLog?.note || '',
        proof_link: existingLog?.proof_link || '',
        image_url: existingLog?.image_url || '',
        reflection: existingLog?.reflection || ''
      }
      if (existingLog) payload.id = existingLog.id

      await upsertMissionLog(payload)
      // Reload logs
      const updatedLogs = await getParticipantLogs(user.id, activeChallenge.id)
      setLogs(updatedLogs)
    } catch (err) {
      console.error(err)
    }
  }

  const openCertModal = (mission) => {
    const log = logs.find(l => l.mission_id === mission.id && l.log_date === selectedDate)
    setSelectedMission(mission)
    setNote(log?.note || '')
    setProofLink(log?.proof_link || '')
    setImageUrl(log?.image_url || '')
    setImageFile(null)
  }

  const submitCertification = async () => {
    if (!selectedMission) return
    try {
      setSubmitting(true)
      const existingLog = logs.find(l => l.mission_id === selectedMission.id && l.log_date === selectedDate)
      
      let finalImageUrl = imageUrl
      if (imageFile) {
        finalImageUrl = await uploadProofImage(imageFile, user.id, activeChallenge.id, selectedDate)
      }

      const payload = {
        challenge_id: activeChallenge.id,
        mission_id: selectedMission.id,
        user_id: user.id,
        log_date: selectedDate,
        is_completed: true,
        note: note.trim(),
        proof_link: proofLink.trim(),
        image_url: finalImageUrl,
        reflection: existingLog?.reflection || ''
      }
      if (existingLog) payload.id = existingLog.id

      await upsertMissionLog(payload)
      const updatedLogs = await getParticipantLogs(user.id, activeChallenge.id)
      setLogs(updatedLogs)
      setSelectedMission(null)
      setImageFile(null)
    } catch (err) {
      alert('인증 제출 실패: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Load reflection when date changes
  useEffect(() => {
    if (activeChallenge) {
      const logWithReflection = logs.find(l => l.log_date === selectedDate && l.reflection)
      setReflectionText(logWithReflection ? logWithReflection.reflection : '')
    }
  }, [selectedDate, logs, activeChallenge])

  const saveReflection = async () => {
    if (!activeChallenge) return
    try {
      setSubmitting(true)
      // Find all logs on this day
      const dayLogs = logs.filter(l => l.log_date === selectedDate)
      
      if (dayLogs.length > 0) {
        // Update all logs on this day to share the reflection
        for (const log of dayLogs) {
          await upsertMissionLog({
            ...log,
            reflection: reflectionText.trim()
          })
        }
      } else {
        // Create an empty placeholder log to save reflection
        if (missions.length === 0) return
        await upsertMissionLog({
          challenge_id: activeChallenge.id,
          mission_id: missions[0].id,
          user_id: user.id,
          log_date: selectedDate,
          is_completed: false,
          reflection: reflectionText.trim()
        })
      }
      
      const updatedLogs = await getParticipantLogs(user.id, activeChallenge.id)
      setLogs(updatedLogs)
      alert('오늘의 셀러 회고가 저장되었습니다! 💾')
    } catch (err) {
      alert('회고 저장 실패: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
          <p className="text-sm text-slate-500 font-medium">챌린지 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // --- EMPTY STATE: User has no enrolled challenges ---
  if (!activeChallenge) {
    const upcomingOrActive = challenges.filter(c => c.status !== 'ended')

    return (
      <div className="flex-grow bg-slate-50 p-6 flex flex-col justify-center max-w-lg mx-auto w-full">
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-2xl text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Smile size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-800">참여 중인 챌린지가 없습니다</h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              온라인 셀러 챌린지에 합류하여 매일 필수적인 매출 성장 루틴을 시작해보세요!
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-[10px] font-extrabold text-slate-400 tracking-wider text-left uppercase">모집 중인 챌린지 기수</h3>
            {upcomingOrActive.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-400">
                현재 신설된 챌린지 기수가 없습니다. 운영자에게 개설을 문의하세요.
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingOrActive.map(ch => (
                  <div key={ch.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center text-left">
                    <div>
                      <h4 className="text-xs font-black text-slate-700">{ch.title}</h4>
                      <p className="text-[9px] text-slate-400 mt-0.5">일정: {ch.start_date} ~ {ch.end_date}</p>
                    </div>
                    <button 
                      onClick={() => handleJoinChallenge(ch.id)}
                      disabled={submitting}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold px-3 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer flex items-center gap-1"
                    >
                      {submitting ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                      신청하기
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button onClick={signOut} className="text-xs font-bold text-slate-400 hover:text-slate-600">다른 계정으로 로그인</button>
          </div>
        </div>
      </div>
    )
  }

  // --- STANDARD DASHBOARD ---
  const progressPercent = stats.todayProgress

  return (
    <div className="flex-grow bg-slate-50 pb-20">
      {/* Dashboard Header */}
      <header className="p-6 pt-8 bg-white shadow-sm border-b border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">셀러루틴</h1>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">챌린저</span>
            </div>
            <p className="text-xs text-indigo-600 font-semibold mt-1 flex items-center gap-1">
              <Layers size={12} />
              {activeChallenge.title} 참여 중
            </p>
          </div>
          <button 
            onClick={signOut}
            className="w-10 h-10 bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-600 rounded-xl flex items-center justify-center transition-all cursor-pointer"
            title="로그아웃"
          >
            <Smile size={18} />
          </button>
        </div>

        {/* Stats Board */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-3xl p-5 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          
          <div className="grid grid-cols-4 gap-1 text-center divide-x divide-white/10">
            <div className="flex flex-col items-center justify-center p-1">
              <p className="text-indigo-200 text-[9px] font-black mb-1">오늘 완료율</p>
              <h4 className="text-xl font-black tracking-tight">{progressPercent}%</h4>
              <div className="w-10 bg-white/20 h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-emerald-400 h-full transition-all" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-1">
              <p className="text-indigo-200 text-[9px] font-black mb-1">연속 달성</p>
              <div className="flex items-center gap-0.5">
                <Flame size={14} className="text-amber-400 fill-amber-400" />
                <h4 className="text-xl font-black tracking-tight">{stats.streak}일</h4>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-1">
              <p className="text-indigo-200 text-[9px] font-black mb-1">이번주 점수</p>
              <div className="flex items-center gap-0.5">
                <Award size={14} className="text-yellow-400 fill-yellow-400" />
                <h4 className="text-xl font-black tracking-tight">{stats.weeklyScore}점</h4>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-1">
              <p className="text-indigo-200 text-[9px] font-black mb-1">누적 인증</p>
              <div className="flex items-center gap-0.5">
                <CheckCircle size={14} className="text-emerald-400" />
                <h4 className="text-xl font-black tracking-tight">{stats.totalCount}회</h4>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 space-y-6 max-w-lg mx-auto w-full">
        
        {/* Weekly Calendar Selector */}
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Calendar size={14} className="text-indigo-600" />
              챌린지 주간 현황
            </h3>
            {selectedDate !== getTodayStr() && (
              <button 
                onClick={() => setSelectedDate(getTodayStr())}
                className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg hover:bg-indigo-100"
              >
                오늘로 이동
              </button>
            )}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weekDates.map(date => {
              const y = date.getFullYear()
              const m = String(date.getMonth() + 1).padStart(2, '0')
              const r = String(date.getDate()).padStart(2, '0')
              const dStr = `${y}-${m}-${r}`
              
              const isSelected = dStr === selectedDate
              const isToday = dStr === getTodayStr()
              
              const doneCount = logs.filter(l => l.log_date === dStr && l.is_completed).length
              const rate = missions.length > 0 ? (doneCount / missions.length) * 100 : 0
              
              const labels = ['일', '월', '화', '수', '목', '금', '토']
              return (
                <div 
                  key={dStr}
                  onClick={() => setSelectedDate(dStr)}
                  className={`flex flex-col items-center p-2 rounded-2xl cursor-pointer transition-all ${isSelected ? 'bg-indigo-50 border border-indigo-200 text-indigo-600' : 'hover:bg-slate-50'}`}
                >
                  <span className={`text-[9px] font-bold ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {labels[date.getDay()]}
                  </span>
                  <span className="text-xs font-black my-1">{date.getDate()}</span>
                  <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                    {rate === 100 ? (
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px] font-black">✓</span>
                    ) : rate > 0 ? (
                      <span className="text-[9px] font-black text-indigo-600">{Math.round(rate)}%</span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Daily Missions */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <CheckCircle className="text-indigo-600" size={18} />
              {selectedDate === getTodayStr() ? '오늘의 실행 미션' : `${selectedDate.split('-')[1]}월 ${selectedDate.split('-')[2]}일 미션 일지`}
            </h3>
          </div>

          {missions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
              설정된 미션이 없습니다. 운영진에게 문의하십시오.
            </div>
          ) : (
            <div className="space-y-3">
              {missions.map(m => {
                const log = logs.find(l => l.mission_id === m.id && l.log_date === selectedDate)
                const isCompleted = log ? log.is_completed : false
                const feedback = feedbacks.find(f => f.mission_log_id === log?.id)

                return (
                  <div 
                    key={m.id}
                    className={`p-4 rounded-2xl border transition-all ${isCompleted ? 'bg-indigo-50/10 border-indigo-100/70' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                  >
                    <div className="flex items-start gap-3">
                      <button 
                        onClick={() => handleToggleMission(m.id)}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all shrink-0 mt-0.5 ${isCompleted ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 bg-white'}`}
                      >
                        {isCompleted && <Check size={14} className="stroke-[3]" />}
                      </button>

                      <div className="flex-grow">
                        <h4 className={`text-xs font-black ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {m.title}
                        </h4>
                        {m.description && <p className="text-[10px] text-slate-400 mt-1 leading-normal">{m.description}</p>}

                        {/* Note & Proof link details */}
                        {log && (log.note || log.proof_link || log.image_url) && (
                          <div className="mt-3 p-3 bg-slate-50 rounded-xl text-[10px] text-slate-600 space-y-1.5 border border-slate-100 animate-fade-in">
                            {log.note && <p><span className="text-slate-400 font-bold">인증기록:</span> {log.note}</p>}
                            {log.proof_link && (
                              <p className="flex items-center gap-1">
                                <span className="text-slate-400 font-bold">참고자료:</span>
                                <a href={log.proof_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-0.5 font-medium">
                                  {log.proof_link}
                                  <ExternalLink size={10} />
                                </a>
                              </p>
                            )}
                            {log.image_url && (
                              <div className="mt-1">
                                <span className="text-slate-400 font-bold block mb-1">인증 이미지:</span>
                                <SecureImage src={log.image_url} alt="인증" className="w-full max-h-32 object-cover rounded-lg border border-slate-100" />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Feedback Display */}
                        {feedback && (() => {
                          const isNewFeedback = feedback.created_at && (new Date() - new Date(feedback.created_at) < 24 * 60 * 60 * 1000);
                          return (
                            <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100/70 text-[10px] text-amber-800 animate-fade-in">
                              <div className="flex justify-between items-center mb-1">
                                <div className="flex gap-1.5 items-center font-black">
                                  <MessageSquare size={12} className="text-amber-600 fill-amber-600/10" />
                                  <span>운영진 피드백</span>
                                </div>
                                {isNewFeedback && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-black rounded-full bg-rose-500 text-white animate-pulse">
                                    새 피드백
                                  </span>
                                )}
                              </div>
                              <p className="leading-relaxed text-amber-700 font-medium">{feedback.comment}</p>
                            </div>
                          );
                        })()}

                        <div className="mt-3 pt-3 border-t border-slate-100/50">
                          <button 
                            onClick={() => openCertModal(m)}
                            className={`text-[10px] font-extrabold flex items-center gap-1 transition-all ${log?.note ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}
                          >
                            <Edit3 size={11} />
                            {log?.note ? '상세 인증 내용 변경' : '한 줄 인증 및 자료 등록'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Daily Reflection */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
            <BookOpen className="text-indigo-600" size={18} />
            <h3 className="text-base font-black text-slate-800">오늘의 셀러 회고</h3>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">
            오늘 실천을 통해 배운 마케팅 소구점, 소싱 분석 등의 인사이트나 피드백을 자유롭게 기록하세요.
          </p>
          <textarea 
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            placeholder="회고 내용을 작성해주세요..."
            className="w-full text-xs p-3.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 h-24 resize-none transition-all"
          />
          <button 
            onClick={saveReflection}
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold py-3.5 rounded-xl text-xs transition-all flex justify-center items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/10"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            셀러 회고 캘린더에 기록 저장
          </button>
        </div>
      </main>

      {/* Verification Drawer / Modal */}
      {selectedMission && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center z-[1000] p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 animate-fade-in shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <h4 className="text-sm font-black text-slate-800">인증 세부 내용 기록</h4>
              <button onClick={() => setSelectedMission(null)} className="text-xs text-slate-400 font-bold hover:text-slate-600">닫기</button>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-[10px] text-slate-500">
              <span className="font-black text-indigo-600 block mb-1">인증 대상 미션:</span>
              {selectedMission.title}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-extrabold text-slate-500 block mb-1">한 줄 인증 메모</label>
                <input 
                  type="text" 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="예: 텀블러 소싱 키워드 15개 분석 완료" 
                  className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold text-slate-500 block mb-1">증빙 URL 링크 (선택)</label>
                <input 
                  type="url" 
                  value={proofLink}
                  onChange={(e) => setProofLink(e.target.value)}
                  placeholder="https://..." 
                  className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold text-slate-500 block mb-1">인증 이미지 업로드 (선택)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                />
                {imageUrl && !imageFile && (
                  <p className="text-[9px] text-emerald-600 mt-1">✓ 이미 등록된 사진이 존재합니다. 변경하려면 새 파일을 선택하세요.</p>
                )}
              </div>
            </div>

            <button 
              onClick={submitCertification}
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold py-3.5 rounded-xl text-xs transition-all flex justify-center items-center gap-1.5 cursor-pointer"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              상세 인증 기록 제출
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
