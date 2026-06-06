import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { 
  getChallenges, 
  getMissions, 
  getMissionLogsForDate, 
  createFeedback, 
  updateFeedback, 
  deleteFeedback,
  getFeedbacksForLog
} from '../../lib/api'
import SecureImage from '../../components/SecureImage'
import { 
  MessageSquare, 
  Calendar, 
  Loader2, 
  Layers, 
  ExternalLink, 
  Send, 
  Trash2, 
  Edit3, 
  Filter, 
  CheckCircle, 
  XCircle 
} from 'lucide-react'

export default function FeedbackManagement() {
  const { user } = useAuth()
  
  // Base states
  const [challenges, setChallenges] = useState([])
  const [selectedChallenge, setSelectedChallenge] = useState(null)
  const [missions, setMissions] = useState([])
  const [logs, setLogs] = useState([])
  const [feedbacks, setFeedbacks] = useState([]) // All feedbacks in the active query
  
  // Date State
  const [selectedDate, setSelectedDate] = useState(getTodayStr())

  // Loading States
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Filter States
  const [statusFilter, setStatusFilter] = useState('all') // all, completed, incomplete, needs_feedback

  // Inline Feedback Editing State
  const [feedbackInputs, setFeedbackInputs] = useState({}) // logId -> text
  const [editingFeedbackId, setEditingFeedbackId] = useState(null)
  const [editingText, setEditingText] = useState('')

  useEffect(() => {
    loadInitData()
  }, [])

  // Reload logs whenever selected challenge or date changes
  useEffect(() => {
    if (selectedChallenge) {
      loadLogsAndFeedbacks()
    }
  }, [selectedChallenge, selectedDate])

  function getTodayStr() {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const r = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${r}`
  }

  async function loadInitData() {
    try {
      setLoading(true)
      const allChallenges = await getChallenges()
      setChallenges(allChallenges)
      
      const activeCh = allChallenges.find(c => c.status === 'active') || allChallenges[0]
      if (activeCh) {
        setSelectedChallenge(activeCh)
        const activeMissions = await getMissions(activeCh.id)
        setMissions(activeMissions)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadLogsAndFeedbacks() {
    if (!selectedChallenge) return
    try {
      setLoading(true)
      // 1. Load logs for this date
      const dateLogs = await getMissionLogsForDate(selectedChallenge.id, selectedDate)
      setLogs(dateLogs)

      // 2. Load associated feedbacks
      const fbs = []
      for (const log of dateLogs) {
        const logFbs = await getFeedbacksForLog(log.id)
        fbs.push(...logFbs)
      }
      setFeedbacks(fbs)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // --- Handlers ---
  const handleSelectChallenge = async (challenge) => {
    setSelectedChallenge(challenge)
    try {
      setLoading(true)
      const activeMissions = await getMissions(challenge.id)
      setMissions(activeMissions)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendFeedback = async (logId, participantId) => {
    const text = feedbackInputs[logId]
    if (!text || !text.trim()) return

    try {
      setSubmitting(true)
      const payload = {
        mission_log_id: logId,
        participant_id: participantId,
        admin_id: user.id,
        comment: text.trim()
      }
      await createFeedback(payload)
      // Clear input
      setFeedbackInputs(prev => ({ ...prev, [logId]: '' }))
      await loadLogsAndFeedbacks()
      alert('피드백 코멘트가 정상적으로 등록되었습니다!')
    } catch (err) {
      alert('피드백 등록 실패: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleStartEdit = (fb) => {
    setEditingFeedbackId(fb.id)
    setEditingText(fb.comment)
  }

  const handleUpdateFeedback = async (fbId) => {
    if (!editingText.trim()) return
    try {
      setSubmitting(true)
      await updateFeedback(fbId, editingText.trim())
      setEditingFeedbackId(null)
      setEditingText('')
      await loadLogsAndFeedbacks()
    } catch (err) {
      alert('수정 실패: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteFeedback = async (fbId) => {
    if (!confirm('피드백 코멘트를 완전히 삭제하시겠습니까?')) return
    try {
      await deleteFeedback(fbId)
      await loadLogsAndFeedbacks()
    } catch (err) {
      alert('삭제 실패: ' + err.message)
    }
  }

  // --- Filter Logic ---
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const hasFeedback = feedbacks.some(f => f.mission_log_id === log.id)
      
      if (statusFilter === 'completed') return log.is_completed
      if (statusFilter === 'incomplete') return !log.is_completed
      if (statusFilter === 'needs_feedback') return log.is_completed && !hasFeedback
      return true
    })
  }, [logs, feedbacks, statusFilter])

  if (loading && challenges.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    )
  }

  return (
    <div className="flex-grow bg-slate-50 p-6 pb-20 max-w-4xl mx-auto w-full space-y-6">
      
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm animate-fade-in">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 font-sans">
            <MessageSquare size={20} className="text-indigo-600" />
            실시간 인증 검토 & 피드백
          </h2>
          <p className="text-[10px] text-slate-400">도전자들이 제출한 일별 자료를 심사하고 개별 격려 피드백을 전달합니다.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Challenge Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <Layers size={14} className="text-slate-400" />
            <select 
              value={selectedChallenge?.id || ''}
              onChange={(e) => {
                const target = challenges.find(c => c.id === e.target.value)
                if (target) handleSelectChallenge(target)
              }}
              className="p-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none font-bold text-slate-700"
            >
              {challenges.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5 text-xs">
            <Calendar size={14} className="text-slate-400" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-2 border border-slate-200 rounded-xl bg-slate-50 font-extrabold text-slate-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/50 pb-2">
        <button 
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all ${statusFilter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
        >
          전체 ({logs.length}개)
        </button>
        <button 
          onClick={() => setStatusFilter('needs_feedback')}
          className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all ${statusFilter === 'needs_feedback' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
        >
          피드백 필요 ({logs.filter(l => l.is_completed && !feedbacks.some(f => f.mission_log_id === l.id)).length}개)
        </button>
        <button 
          onClick={() => setStatusFilter('completed')}
          className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all ${statusFilter === 'completed' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
        >
          인증 완료 ({logs.filter(l => l.is_completed).length}개)
        </button>
        <button 
          onClick={() => setStatusFilter('incomplete')}
          className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all ${statusFilter === 'incomplete' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
        >
          미달성/대기 ({logs.filter(l => !l.is_completed).length}개)
        </button>
      </div>

      {/* Logs to Review */}
      {loading ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="animate-spin text-indigo-600" size={24} />
          <span className="text-xs text-slate-400">일지를 조회하는 중...</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-100 shadow-sm text-center text-xs text-slate-400">
          선택한 날짜 및 필터에 매칭되는 인증 일지가 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map(log => {
            const mission = missions.find(m => m.id === log.mission_id)
            const logFeedback = feedbacks.find(f => f.mission_log_id === log.id)
            const inputVal = feedbackInputs[log.id] || ''

            return (
              <div key={log.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4 animate-fade-in relative overflow-hidden">
                
                {/* Completed state indicator */}
                <div className={`absolute top-0 right-0 px-3 py-1 text-[8px] font-black rounded-bl-xl border-l border-b ${
                  log.is_completed 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    : 'bg-rose-50 text-rose-600 border-rose-100'
                }`}>
                  {log.is_completed ? '완료' : '미완료/대기'}
                </div>

                {/* Submitter & Mission Title */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs font-black text-slate-800">
                      {log.profiles?.name} <span className="text-[10px] text-slate-400 font-medium">({log.profiles?.email})</span>
                    </h3>
                    <p className="text-[10px] font-bold text-indigo-600 mt-1 flex items-center gap-1">
                      <span>•</span>
                      {mission?.title || '기타 미션'}
                    </p>
                  </div>
                </div>

                {/* Student certification content */}
                {(log.note || log.proof_link || log.image_url || log.reflection) && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 space-y-2 text-[10px] text-slate-600">
                    {log.note && (
                      <p className="leading-relaxed">
                        <span className="text-slate-400 font-bold">인증내용:</span> {log.note}
                      </p>
                    )}
                    {log.proof_link && (
                      <p className="flex items-center gap-1">
                        <span className="text-slate-400 font-bold">참고자료:</span>
                        <a href={log.proof_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-0.5 font-bold">
                          {log.proof_link}
                          <ExternalLink size={10} />
                        </a>
                      </p>
                    )}
                    {log.image_url && (
                      <div>
                        <span className="text-slate-400 font-bold block mb-1">인증 이미지:</span>
                        <SecureImage src={log.image_url} alt="인증" className="max-h-40 object-cover rounded-lg border border-slate-100 shadow-sm" />
                      </div>
                    )}
                    {log.reflection && (
                      <p className="pt-2 border-t border-slate-200/50 leading-relaxed italic">
                        <span className="text-indigo-600 font-bold not-italic block mb-0.5">💡 도전자 오늘 회고:</span>
                        "{log.reflection}"
                      </p>
                    )}
                  </div>
                )}

                {/* Feedback writing drawer */}
                <div className="pt-4 border-t border-slate-50 space-y-3">
                  
                  {logFeedback ? (
                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100/50 space-y-2 text-[10px]">
                      <div className="flex justify-between items-center text-amber-800 font-black">
                        <span className="flex items-center gap-1">
                          <MessageSquare size={12} className="text-amber-600" />
                          등록된 운영진 피드백
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleStartEdit(logFeedback)}
                            className="hover:text-indigo-600 flex items-center gap-0.5"
                          >
                            <Edit3 size={10} /> 수정
                          </button>
                          <button 
                            onClick={() => handleDeleteFeedback(logFeedback.id)}
                            className="hover:text-rose-600 flex items-center gap-0.5"
                          >
                            <Trash2 size={10} /> 삭제
                          </button>
                        </div>
                      </div>

                      {editingFeedbackId === logFeedback.id ? (
                        <div className="space-y-2 pt-1">
                          <textarea 
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 h-16 resize-none"
                          />
                          <div className="flex justify-end gap-1.5">
                            <button 
                              onClick={() => handleUpdateFeedback(logFeedback.id)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1 rounded-lg"
                            >
                              저장
                            </button>
                            <button 
                              onClick={() => { setEditingFeedbackId(null); setEditingText(''); }}
                              className="bg-slate-200 text-slate-600 font-bold px-3 py-1 rounded-lg"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-amber-700 leading-relaxed font-semibold">{logFeedback.comment}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={inputVal}
                        onChange={(e) => setFeedbackInputs(prev => ({ ...prev, [log.id]: e.target.value }))}
                        placeholder="이 미션 로그에 멘토 피드백 코멘트 남기기..." 
                        className="flex-grow text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                      />
                      <button 
                        onClick={() => handleSendFeedback(log.id, log.user_id)}
                        disabled={submitting || !inputVal.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 rounded-xl flex items-center justify-center cursor-pointer transition-all"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  )}

                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
