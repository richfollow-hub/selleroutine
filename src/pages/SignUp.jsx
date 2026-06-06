import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

export default function SignUp() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSignUp = async (e) => {
    e.preventDefault()
    if (!name || !email || !password) {
      return setError('모든 가입 양식을 입력해주세요.')
    }
    if (password.length < 6) {
      return setError('비밀번호는 최소 6자리 이상이어야 합니다.')
    }

    try {
      setError('')
      setSuccess('')
      setLoading(true)
      await signUp(email, password, name)
      setSuccess('회원가입이 완료되었습니다! 가입 시 입력한 이메일로 인증 메일이 발송되었을 수 있습니다. 로그인 페이지로 이동하여 진행해주세요.')
      setTimeout(() => {
        navigate('/login')
      }, 5000)
    } catch (err) {
      console.error(err)
      setError(err.message || '회원가입에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-center bg-slate-50 p-6">
      <div className="glass-card max-w-md w-full mx-auto p-8 rounded-3xl border border-slate-100 shadow-2xl bg-white space-y-6 animate-fade-in">
        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-900 font-sans">챌린저 회원가입</h2>
          <p className="text-xs text-slate-400 mt-1.5">새로운 챌린저 계정을 등록합니다.</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-medium border border-rose-100 animate-fade-in">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 p-3.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-medium border border-emerald-100 animate-fade-in">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="text-[10px] font-extrabold text-slate-500 block mb-1">성명 / 닉네임</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="대표자명 또는 닉네임" 
              className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-extrabold text-slate-500 block mb-1">이메일 주소</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@seller.com" 
              className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-extrabold text-slate-500 block mb-1">비밀번호</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자리 이상 비밀번호 입력" 
              className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
              required
            />
          </div>

          <div className="text-slate-400 text-[10px] leading-relaxed px-1">
            * 기본 회원가입 시 챌린지 참가자(Participant) 권한으로 생성됩니다. 운영자(Admin) 권한은 관리자 승인 하에 부여됩니다.
          </div>

          <button 
            type="submit"
            disabled={loading || !!success}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold py-3.5 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                계정 생성 중...
              </>
            ) : '계정 생성하기'}
          </button>
          
          <Link 
            to="/login"
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold py-3.5 rounded-xl transition-all text-xs flex items-center justify-center gap-2"
          >
            이전으로 돌아가기
          </Link>
        </form>
      </div>
    </div>
  )
}
