import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AlertCircle, Loader2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signIn, profile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (profile) {
      if (profile.role === 'admin') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    }
  }, [profile, navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      return setError('이메일과 비밀번호를 입력해주세요.')
    }
    try {
      setError('')
      setLoading(true)
      await signIn(email, password)
      // Redirection is handled in the useEffect once the profile state resolves
    } catch (err) {
      console.error(err)
      setError(err.message || '로그인에 실패했습니다. 계정 정보를 확인해주세요.')
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-center bg-slate-50 p-6">
      <div className="glass-card max-w-md w-full mx-auto p-8 rounded-3xl border border-slate-100 shadow-2xl bg-white space-y-6 animate-fade-in">
        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-900 font-sans">셀러루틴 로그인</h2>
          <p className="text-xs text-slate-400 mt-1.5">챌린지 세션에 접속하여 오늘 미션을 실행하세요.</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-medium border border-rose-100 animate-fade-in">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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
              placeholder="••••••••" 
              className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
              required
            />
          </div>

          <div className="flex justify-between items-center text-xs pt-1">
            <Link to="/reset-password" className="text-slate-400 hover:text-slate-600 font-medium">비밀번호 찾기</Link>
            <Link to="/signup" className="text-indigo-600 hover:text-indigo-800 font-extrabold">회원가입 하기</Link>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold py-3.5 rounded-xl transition-all text-xs flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-lg shadow-indigo-600/10"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                로그인 중...
              </>
            ) : '로그인하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
