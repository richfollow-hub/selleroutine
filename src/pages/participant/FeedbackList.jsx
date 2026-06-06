import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getFeedbacksForParticipant } from '../../lib/api'
import { MessageSquare, Calendar, Loader2, Award, Quote } from 'lucide-react'

export default function FeedbackList() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [feedbacks, setFeedbacks] = useState([])

  useEffect(() => {
    loadFeedbacks()
  }, [user])

  async function loadFeedbacks() {
    try {
      setLoading(true)
      const data = await getFeedbacksForParticipant(user.id)
      setFeedbacks(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={28} />
      </div>
    )
  }

  return (
    <div className="flex-grow bg-slate-50 p-6 pb-20 max-w-lg mx-auto w-full">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="text-indigo-600" size={22} />
        <h2 className="text-xl font-black text-slate-800 font-sans">운영자 피드백 보드</h2>
      </div>

      {feedbacks.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm text-xs text-slate-400 space-y-2">
          아직 등록된 운영자 피드백이 없습니다.<br />미션에 성실히 참여하시면 멘토들의 피드백이 도착합니다!
        </div>
      ) : (
        <div className="space-y-4">
          {feedbacks.map(f => {
            const logDate = f.mission_logs?.log_date
            const missionTitle = f.mission_logs?.missions?.title

            return (
              <div key={f.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden animate-fade-in space-y-3">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-violet-600"></div>

                <div className="flex justify-between items-center pl-2">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 text-[9px] font-black rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                      {missionTitle || '미션 피드백'}
                    </span>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar size={10} />
                      인증 날짜: {logDate}
                    </p>
                  </div>
                  <Award size={18} className="text-amber-400 fill-amber-400/10 shrink-0" />
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 flex gap-2 relative">
                  <Quote size={14} className="text-indigo-300 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {f.comment}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
