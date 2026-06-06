import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getKeywordNotes, createKeywordNote, deleteKeywordNote } from '../../lib/api'
import { Key, Trash2, Plus, Loader2, Tag, FileText } from 'lucide-react'

export default function KeywordNotes() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [keywords, setKeywords] = useState([])

  const [mainKeyword, setMainKeyword] = useState('')
  const [longtailKeywords, setLongtailKeywords] = useState('')
  const [competitorKeywords, setCompetitorKeywords] = useState('')
  const [memo, setMemo] = useState('')

  useEffect(() => {
    loadKeywords()
  }, [user])

  async function loadKeywords() {
    try {
      setLoading(true)
      const data = await getKeywordNotes(user.id)
      setKeywords(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddKeyword = async (e) => {
    e.preventDefault()
    if (!mainKeyword.trim()) return

    try {
      setSubmitting(true)
      const payload = {
        user_id: user.id,
        main_keyword: mainKeyword.trim(),
        longtail_keywords: longtailKeywords.trim(),
        competitor_keywords: competitorKeywords.trim(),
        memo: memo.trim()
      }

      await createKeywordNote(payload)
      setMainKeyword('')
      setLongtailKeywords('')
      setCompetitorKeywords('')
      setMemo('')
      await loadKeywords()
    } catch (err) {
      alert('키워드 등록 실패: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('키워드 기록을 삭제하시겠습니까?')) return
    try {
      await deleteKeywordNote(id)
      await loadKeywords()
    } catch (err) {
      alert('삭제 실패: ' + err.message)
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
        <Key className="text-indigo-600" size={22} />
        <h2 className="text-xl font-black text-slate-800 font-sans">키워드 분석 보드</h2>
      </div>

      <form onSubmit={handleAddKeyword} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3 mb-6 animate-fade-in">
        <h3 className="text-xs font-black text-slate-800 mb-1">키워드 발굴 및 분석 기록</h3>
        
        <div>
          <label className="text-[10px] font-extrabold text-slate-400 block mb-1">대표 키워드</label>
          <input 
            type="text" 
            value={mainKeyword}
            onChange={(e) => setMainKeyword(e.target.value)}
            placeholder="예: 캠핑 텀블러" 
            className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
            required
          />
        </div>

        <div>
          <label className="text-[10px] font-extrabold text-slate-400 block mb-1">세부 연관 키워드 (쉼표 구분)</label>
          <input 
            type="text" 
            value={longtailKeywords}
            onChange={(e) => setLongtailKeywords(e.target.value)}
            placeholder="예: 감성 캠핑 컵, 스테인리스 머그" 
            className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
          />
        </div>

        <div>
          <label className="text-[10px] font-extrabold text-slate-400 block mb-1">경쟁사 썸네일/태그 키워드</label>
          <input 
            type="text" 
            value={competitorKeywords}
            onChange={(e) => setCompetitorKeywords(e.target.value)}
            placeholder="예: 스탠리 텀블러, 써모스 컵" 
            className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
          />
        </div>

        <div>
          <label className="text-[10px] font-extrabold text-slate-400 block mb-1">분석 메모</label>
          <textarea 
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="경쟁 강도나 검색량 조사 결과 적기..." 
            className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 h-16 resize-none"
          />
        </div>

        <button 
          type="submit"
          disabled={submitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold py-3 rounded-xl text-xs transition-all flex justify-center items-center gap-1 cursor-pointer"
        >
          {submitting ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          키워드 분석 추가
        </button>
      </form>

      {keywords.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm text-xs text-slate-400">
          등록된 키워드가 없습니다. 소형 키워드와 연관 키워드를 분석하여 소싱 경쟁력을 강화하세요!
        </div>
      ) : (
        <div className="space-y-4">
          {keywords.map(kw => (
            <div key={kw.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3 relative animate-fade-in">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Tag className="text-indigo-500" size={16} />
                  <h4 className="text-sm font-black text-slate-800">{kw.main_keyword}</h4>
                </div>
                <button 
                  onClick={() => handleDelete(kw.id)}
                  className="text-slate-400 hover:text-rose-500 transition-all p-1 cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="space-y-2">
                {kw.longtail_keywords && (
                  <div className="text-[10px] text-slate-600">
                    <span className="font-extrabold text-slate-400 block mb-1">연관 세부 키워드</span>
                    <div className="flex flex-wrap gap-1.5">
                      {kw.longtail_keywords.split(',').map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium border border-slate-200/50">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {kw.competitor_keywords && (
                  <div className="text-[10px] text-slate-600">
                    <span className="font-extrabold text-slate-400 block mb-1">경쟁사 매칭 키워드</span>
                    <div className="flex flex-wrap gap-1.5">
                      {kw.competitor_keywords.split(',').map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 font-medium border border-purple-100/50">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {kw.memo && (
                  <div className="p-3 bg-slate-50 rounded-xl text-[10px] text-slate-600 border border-slate-100/50 flex gap-1.5 mt-2">
                    <FileText size={12} className="text-slate-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed font-medium">{kw.memo}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
