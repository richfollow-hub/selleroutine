import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { 
  getAdminChallenges, 
  createChallenge, 
  updateChallenge, 
  getMissions, 
  createMission, 
  deleteMission,
  seedDefaultMissions 
} from '../../lib/api'
import { 
  Layers, 
  Plus, 
  Calendar, 
  ChevronRight, 
  Loader2, 
  Check, 
  Trash2, 
  Edit3, 
  BookOpen 
} from 'lucide-react'

export default function ChallengeManagement() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Challenges state
  const [challenges, setChallenges] = useState([])
  const [selectedChallenge, setSelectedChallenge] = useState(null)
  
  // Missions state
  const [missions, setMissions] = useState([])

  // Challenge Form Form States
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState('scheduled') // scheduled, active, ended
  const [editingChallengeId, setEditingChallengeId] = useState(null)

  // Mission Form States
  const [missionTitle, setMissionTitle] = useState('')
  const [missionDesc, setMissionDesc] = useState('')

  useEffect(() => {
    if (user) {
      loadChallenges()
    }
  }, [user])

  async function loadChallenges() {
    if (!user) return
    try {
      setLoading(true)
      const data = await getAdminChallenges(user.id)
      setChallenges(data)
      if (data.length > 0 && !selectedChallenge) {
        handleSelectChallenge(data[0])
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
      const activeMissions = await getMissions(challenge.id)
      setMissions(activeMissions)
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreateOrUpdateChallenge = async (e) => {
    e.preventDefault()
    if (!title.trim() || !startDate || !endDate) return

    try {
      setSubmitting(true)
      const payload = {
        title: title.trim(),
        description: description.trim(),
        start_date: startDate,
        end_date: endDate,
        status,
        created_by: user.id,
        updated_at: new Date().toISOString()
      }

      if (editingChallengeId) {
        await updateChallenge(editingChallengeId, payload)
        alert('챌린지 기수가 성공적으로 수정되었습니다.')
      } else {
        const newChallenge = await createChallenge(payload)
        
        // Seed default 8 routines automatically for convenience
        await seedDefaultMissions(newChallenge.id)
        alert('챌린지 기수가 신설되었으며 기본 8대 필수 미션이 자동 설정되었습니다. 🏆')
      }

      // Reset Form
      setTitle('')
      setDescription('')
      setStartDate('')
      setEndDate('')
      setStatus('scheduled')
      setEditingChallengeId(null)
      
      await loadChallenges()
    } catch (err) {
      alert('저장 실패: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditClick = (c) => {
    setEditingChallengeId(c.id)
    setTitle(c.title)
    setDescription(c.description || '')
    setStartDate(c.start_date)
    setEndDate(c.end_date)
    setStatus(c.status)
  }

  const handleAddMission = async (e) => {
    e.preventDefault()
    if (!selectedChallenge || !missionTitle.trim()) return

    try {
      setSubmitting(true)
      const payload = {
        challenge_id: selectedChallenge.id,
        title: missionTitle.trim(),
        description: missionDesc.trim(),
        sort_order: missions.length + 1,
        is_active: true
      }
      await createMission(payload)
      setMissionTitle('')
      setMissionDesc('')
      
      // Reload missions
      const activeMissions = await getMissions(selectedChallenge.id)
      setMissions(activeMissions)
    } catch (err) {
      alert('미션 등록 실패: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteMission = async (id) => {
    if (!confirm('미션을 삭제하시겠습니까?')) return
    try {
      await deleteMission(id)
      const activeMissions = await getMissions(selectedChallenge.id)
      setMissions(activeMissions)
    } catch (err) {
      alert('미션 삭제 실패: ' + err.message)
    }
  }

  const handleSeedMissions = async () => {
    if (!selectedChallenge) return
    if (!confirm('현재 기수에 기본 8대 루틴 미션을 재구축하시겠습니까?')) return
    try {
      setSubmitting(true)
      await seedDefaultMissions(selectedChallenge.id)
      const activeMissions = await getMissions(selectedChallenge.id)
      setMissions(activeMissions)
      alert('기본 8대 미션 세팅이 복구되었습니다.')
    } catch (err) {
      alert('실패: ' + err.message)
    } finally {
      setSubmitting(false)
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
    <div className="flex-grow bg-slate-50 p-6 pb-20 max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-6">
      
      {/* Col 1: Challenge List & Create Form (8 cols on MD) */}
      <div className="md:col-span-7 space-y-6">
        
        {/* Challenge form */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-800 border-b border-slate-50 pb-2">
            {editingChallengeId ? '챌린지 기수 수정' : '신규 챌린지 기수 개설'}
          </h3>
          <form onSubmit={handleCreateOrUpdateChallenge} className="space-y-3">
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 block mb-1">챌린지 기수명</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 셀러루틴 1기 마스터 챌린지" 
                className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 block mb-1">상세 설명</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="챌린지 목표 및 규칙 설명..." 
                className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 h-16 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-extrabold text-slate-500 block mb-1">시작일</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold text-slate-500 block mb-1">종료일</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 block mb-1">챌린지 기수 상태</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 font-medium"
              >
                <option value="scheduled">예정됨 (Scheduled)</option>
                <option value="active">진행중 (Active)</option>
                <option value="ended">종료됨 (Ended)</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                type="submit"
                disabled={submitting}
                className="flex-grow bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold py-3.5 rounded-xl text-xs transition-all flex justify-center items-center gap-1 cursor-pointer"
              >
                {submitting ? <Loader2 size={12} className="animate-spin" /> : editingChallengeId ? <Check size={12} /> : <Plus size={12} />}
                {editingChallengeId ? '기수 정보 변경 완료' : '신규 기수 신설 및 기본미션 자동생성'}
              </button>
              {editingChallengeId && (
                <button 
                  type="button"
                  onClick={() => {
                    setEditingChallengeId(null)
                    setTitle('')
                    setDescription('')
                    setStartDate('')
                    setEndDate('')
                    setStatus('scheduled')
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold px-4 rounded-xl text-xs"
                >
                  취소
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Challenge List Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-800">등록된 전체 챌린지</h3>
          <div className="space-y-2">
            {challenges.map(c => {
              const isSelected = selectedChallenge?.id === c.id
              return (
                <div 
                  key={c.id}
                  onClick={() => handleSelectChallenge(c)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${isSelected ? 'border-indigo-500 bg-indigo-50/10' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                >
                  <div>
                    <h4 className="text-xs font-black text-slate-700">{c.title}</h4>
                    <p className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Calendar size={10} />
                      일정: {c.start_date} ~ {c.end_date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[8px] font-black rounded-full border ${
                      c.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : c.status === 'scheduled'
                          ? 'bg-amber-50 text-amber-600 border-amber-100'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {c.status === 'active' ? '진행중' : c.status === 'scheduled' ? '예정됨' : '종료됨'}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditClick(c)
                      }}
                      className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg"
                      title="수정"
                    >
                      <Edit3 size={11} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* Col 2: Mission List for selected challenge (5 cols on MD) */}
      <div className="md:col-span-5 space-y-6">
        
        {selectedChallenge && (
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <h3 className="text-xs font-black text-slate-800">
                [{selectedChallenge.title}] 미션 관리
              </h3>
              {missions.length === 0 && (
                <button 
                  onClick={handleSeedMissions}
                  className="text-[9px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-1 rounded"
                >
                  기본미션 복구
                </button>
              )}
            </div>

            {/* Mission form */}
            <form onSubmit={handleAddMission} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100/50 space-y-3">
              <span className="text-[10px] font-black text-slate-500 block">커스텀 미션 추가</span>
              <input 
                type="text" 
                value={missionTitle}
                onChange={(e) => setMissionTitle(e.target.value)}
                placeholder="미션명 (예: 쿠팡 썸네일 A/B 테스트)" 
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                required
              />
              <input 
                type="text" 
                value={missionDesc}
                onChange={(e) => setMissionDesc(e.target.value)}
                placeholder="수행 방법 가이드 설명 (선택)" 
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              />
              <button 
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-2 rounded-xl text-xs transition-all flex justify-center items-center gap-1 cursor-pointer"
              >
                <Plus size={12} />
                미션 신규 등록
              </button>
            </form>

            {/* Mission List */}
            {missions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                등록된 미션이 없습니다. 기본미션 복구 단추를 누르거나 수동 등록하십시오.
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {missions.map(m => (
                  <div key={m.id} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/70 flex justify-between items-center text-left">
                    <div className="max-w-[80%]">
                      <span className="text-[9px] font-black text-indigo-500 block">순서 {m.sort_order}</span>
                      <h4 className="text-xs font-black text-slate-700">{m.title}</h4>
                      {m.description && <p className="text-[9px] text-slate-400 leading-normal mt-0.5">{m.description}</p>}
                    </div>
                    <button 
                      onClick={() => handleDeleteMission(m.id)}
                      className="text-slate-400 hover:text-rose-500 transition-all p-1.5 rounded-lg hover:bg-rose-50 shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  )
}
