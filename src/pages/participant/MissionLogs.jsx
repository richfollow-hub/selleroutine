import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getChallenges, getChallengeMembers, getParticipantLogs, getMissions } from '../../lib/api'
import SecureImage from '../../components/SecureImage'
import { Calendar, Loader2, BookOpen, ExternalLink } from 'lucide-react'

export default function MissionLogs() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState([])
  const [missions, setMissions] = useState([])
  const [activeChallenge, setActiveChallenge] = useState(null)

  useEffect(() => {
    loadLogs()
  }, [user])

  async function loadLogs() {
    try {
      setLoading(true)
      const allChallenges = await getChallenges()
      
      let myActive = null
      for (const ch of allChallenges) {
        const members = await getChallengeMembers(ch.id)
        if (members.some(m => m.user_id === user.id)) {
          myActive = ch
          break
        }
      }

      if (myActive) {
        setActiveChallenge(myActive)
        const activeMissions = await getMissions(myActive.id)
        setMissions(activeMissions)

        const userLogs = await getParticipantLogs(user.id, myActive.id)
        setLogs(userLogs)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const groupedLogs = logs.reduce((acc, log) => {
    if (!acc[log.log_date]) {
      acc[log.log_date] = {
        logs: [],
        reflection: ''
      }
    }
    if (log.is_completed) {
      acc[log.log_date].logs.push(log)
    }
    if (log.reflection) {
      acc[log.log_date].reflection = log.reflection
    }
    return acc
  }, {})

  const sortedDates = Object.keys(groupedLogs).sort((a, b) => new Date(b) - new Date(a))

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
        <Calendar className="text-indigo-600" size={22} />
        <h2 className="text-xl font-black text-slate-800 font-sans">내 인증 히스토리</h2>
      </div>

      {!activeChallenge ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm text-xs text-slate-400">
          참여 중인 챌린지가 없어 인증 히스토리를 불러올 수 없습니다.
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm text-xs text-slate-400 space-y-2">
          아직 제출된 인증 기록이 없습니다.<br />대시보드에서 오늘의 첫 루틴을 인증해보세요!
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(dateStr => {
            const dayData = groupedLogs[dateStr]
            const completedCount = dayData.logs.length

            return (
              <div key={dateStr} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                    <Calendar size={12} className="text-slate-400" />
                    {dateStr}
                  </span>
                  <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                    {completedCount}개 완료
                  </span>
                </div>

                {completedCount === 0 ? (
                  <p className="text-[10px] text-slate-400 italic">완료된 미션이 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {dayData.logs.map(log => {
                      const mission = missions.find(m => m.id === log.mission_id)
                      return (
                        <div key={log.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50 space-y-2 text-[10px]">
                          <div className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-[8px]">✓</span>
                            <span className="font-extrabold text-slate-700">{mission?.title || '기타 미션'}</span>
                          </div>
                          {log.note && (
                            <p className="text-slate-600 pl-5 leading-relaxed">
                              <span className="text-slate-400 font-bold">인증내용:</span> {log.note}
                            </p>
                          )}
                          {log.proof_link && (
                            <p className="pl-5 flex items-center gap-1 text-slate-600">
                              <span className="text-slate-400 font-bold">링크:</span>
                              <a href={log.proof_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-0.5">
                                바로가기
                                <ExternalLink size={8} />
                              </a>
                            </p>
                          )}
                          {log.image_url && (
                            <div className="pl-5 mt-2">
                              <SecureImage src={log.image_url} alt="인증 이미지" className="max-h-24 object-cover rounded-lg border border-slate-100" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {dayData.reflection && (
                  <div className="p-3.5 bg-indigo-50/20 rounded-2xl border border-indigo-100/30 text-[10px] text-slate-600 space-y-1">
                    <div className="flex items-center gap-1 font-black text-indigo-700">
                      <BookOpen size={12} />
                      <span>오늘의 셀러 회고</span>
                    </div>
                    <p className="leading-relaxed font-medium pl-4">{dayData.reflection}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
