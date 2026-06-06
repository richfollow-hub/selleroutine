import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRecoveryMode, setIsRecoveryMode] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const { resetPassword, updatePassword } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.includes('type=recovery')) {
      setIsRecoveryMode(true)
    }
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsRecoveryMode(true)
      }
    })
  }, [])

  const handleSendLink = async (e) => {
    e.preventDefault()
    if (!email) {
      return setError('이메일 주소를 입력해주세요.')
    }
    try {
      setError('')
      setSuccess('')
      setLoading(true)
      await resetPassword(email)
      setSuccess('비밀번호 재설정 이메일이 발송되었습니다. 메일함의 링크를 확인해주세요.')
    } catch (err) {
      console.error(err)
      setError(err.message || '이메일 발송에 실패했습니다. 올바른 이메일 주소인지 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!password || password.length < 6) {
      return setError('새 비밀번호는 최소 6자리 이상이어야 합니다.')
    }
    try {
      setError('')
      setSuccess('')
      setLoading(true)
      await updatePassword(password)
      setSuccess('비밀번호가 성공적으로 업데이트되었습니다! 3초 후 로그인 페이지로 이동합니다.')
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      console.error(err)
      setError(err.message || '비밀번호 변경에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-center bg-slate-50 p-6">
      <div className="glass-card max-w-md w-full mx-auto p-8 rounded-3xl border border-slate-100 shadow-2xl bg-white space-y-6 animate-fade-in">
        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-900 font-sans">
            {isRecoveryMode ? '새 비밀번호 설정' : '비밀번호 재설정'}
          </h2>
          <p className="text-xs text-slate-400 mt-1.5">
            {isRecoveryMode 
              ? '변경할 새로운 비밀번호를 입력해주세요.' 
              : '가입 시 입력했던 이메일 주소를 입력하시면 재설정 메일을 보내드립니다.'}
          </p>
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

        {isRecoveryMode ? (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 block mb-1">새 비밀번호</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자리 이상 새 비밀번호 입력" 
                className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold py-3.5 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  비밀번호 저장 중...
                </>
              ) : '새 비밀번호 저장'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSendLink} className="space-y-4">
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

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold py-3.5 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  링크 발송 중...
                </>
              ) : '재설정 이메일 발송'}
            </button>

            <Link 
              to="/login"
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold py-3.5 rounded-xl transition-all text-xs flex items-center justify-center gap-2"
            >
              이전으로 돌아가기
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
