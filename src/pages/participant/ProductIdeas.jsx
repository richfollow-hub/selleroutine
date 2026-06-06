import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getProductIdeas, createProductIdea, deleteProductIdea } from '../../lib/api'
import { Lightbulb, Trash2, Plus, Loader2, Link2, Percent, FileText } from 'lucide-react'

export default function ProductIdeas() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [ideas, setIdeas] = useState([])

  const [title, setTitle] = useState('')
  const [supplierLink, setSupplierLink] = useState('')
  const [margin, setMargin] = useState(30)
  const [memo, setMemo] = useState('')

  useEffect(() => {
    loadIdeas()
  }, [user])

  async function loadIdeas() {
    try {
      setLoading(true)
      const data = await getProductIdeas(user.id)
      setIdeas(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddIdea = async (e) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      setSubmitting(true)
      const payload = {
        user_id: user.id,
        title: title.trim(),
        supplier_link: supplierLink.trim(),
        estimated_margin: Number(margin),
        memo: memo.trim(),
        status: 'pending'
      }

      await createProductIdea(payload)
      setTitle('')
      setSupplierLink('')
      setMargin(30)
      setMemo('')
      await loadIdeas()
    } catch (err) {
      alert('아이디어 등록 실패: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('아이디어를 삭제하시겠습니까?')) return
    try {
      await deleteProductIdea(id)
      await loadIdeas()
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
        <Lightbulb className="text-indigo-600" size={22} />
        <h2 className="text-xl font-black text-slate-800 font-sans">소싱 아이디어 보드</h2>
      </div>

      <form onSubmit={handleAddIdea} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3 mb-6 animate-fade-in">
        <h3 className="text-xs font-black text-slate-800 mb-1">새로운 상품 발굴하기</h3>
        <input 
          type="text" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="소싱 후보 상품명..." 
          className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
          required
        />
        <input 
          type="url" 
          value={supplierLink}
          onChange={(e) => setSupplierLink(e.target.value)}
          placeholder="공급처 / 도매처 링크 (1688, 도매꾹 등)..." 
          className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
        />
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-slate-400 font-bold flex items-center gap-1">
            <Percent size={14} />
            예상 마진율:
          </span>
          <div className="flex items-center gap-1">
            <input 
              type="number" 
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
              className="w-12 text-center border-b border-slate-300 focus:outline-none text-xs font-extrabold"
            />
            <span className="font-extrabold text-slate-700">%</span>
          </div>
        </div>
        <textarea 
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="기록하고 싶은 메모나 차별화 소구점..." 
          className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 h-16 resize-none"
        />
        <button 
          type="submit"
          disabled={submitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold py-3 rounded-xl text-xs transition-all flex justify-center items-center gap-1 cursor-pointer"
        >
          {submitting ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          발굴 아이디어 추가
        </button>
      </form>

      {ideas.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm text-xs text-slate-400">
          등록된 아이디어가 없습니다. 팔릴 만한 후보 상품을 기록해보세요!
        </div>
      ) : (
        <div className="space-y-4">
          {ideas.map(i => (
            <div key={i.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3 relative animate-fade-in">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-black text-slate-800">{i.title}</h4>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-black rounded bg-emerald-50 text-emerald-600 border border-emerald-100">
                    예상 마진 {i.estimated_margin}%
                  </span>
                </div>
                <button 
                  onClick={() => handleDelete(i.id)}
                  className="text-slate-400 hover:text-rose-500 transition-all p-1 cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {i.supplier_link && (
                <div className="flex items-center gap-1 text-[10px]">
                  <Link2 size={12} className="text-slate-400" />
                  <a href={i.supplier_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate max-w-[200px]">
                    공급처 링크 이동
                  </a>
                </div>
              )}

              {i.memo && (
                <div className="p-3 bg-slate-50 rounded-xl text-[10px] text-slate-600 border border-slate-100/50 flex gap-1.5">
                  <FileText size={12} className="text-slate-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-medium">{i.memo}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
