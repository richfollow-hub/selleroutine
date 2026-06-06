import { Link } from 'react-router-dom'
import { TrendingUp, CheckCircle, Zap, MessageSquare, ArrowRight } from 'lucide-react'

export default function Landing() {
  return (
    <div className="flex-1 flex flex-col justify-between bg-gradient-to-b from-slate-900 via-slate-950 to-indigo-950 text-white min-h-screen p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -left-20 bottom-20 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="pt-16 text-center max-w-lg mx-auto z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 backdrop-blur-md mb-6">
          <TrendingUp className="text-indigo-400" size={14} />
          <span className="text-[10px] font-bold tracking-wider text-indigo-200 uppercase">SELLEROUTINE 챌린지</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-6">
          매출은 감이 아니라,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-indigo-200 to-violet-300">
            반복 실행
          </span>에서 나온다
        </h1>
        <p className="text-slate-300 text-sm md:text-base max-w-sm mx-auto leading-relaxed">
          온라인 셀러를 위한 실행 인증 챌린지 서비스. 하루 8개 핵심 판매 루틴을 반복하여 매출 궤도를 돌파하세요!
        </p>
      </div>

      {/* Features Grid */}
      <div className="my-10 space-y-4 max-w-md mx-auto w-full z-10">
        <div className="glass-card p-5 rounded-2xl border-white/5 bg-white/5 flex gap-4 items-center transition-all hover:bg-white/10">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
            <CheckCircle size={24} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-white">셀러 최적화 핵심 루틴</h3>
            <p className="text-xs text-slate-400 mt-1">상품 리서치, 키워드 추출 등 8대 필수 할 일 제공</p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border-white/5 bg-white/5 flex gap-4 items-center transition-all hover:bg-white/10">
          <div className="w-12 h-12 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center shrink-0">
            <Zap size={24} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-white">실시간 기수제 실행 인증</h3>
            <p className="text-xs text-slate-400 mt-1">증빙 링크와 한 줄 기록을 작성해 투명한 습관화</p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border-white/5 bg-white/5 flex gap-4 items-center transition-all hover:bg-white/10">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
            <MessageSquare size={24} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-white">운영자 피드백 & 경고 보드</h3>
            <p className="text-xs text-slate-400 mt-1">3일 연속 미인증자 케어 및 실시간 멘토 피드백</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 pb-12 max-w-sm mx-auto w-full z-10">
        <Link 
          to="/login"
          className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-extrabold py-4 px-6 rounded-2xl shadow-xl shadow-indigo-950/50 transition-all text-sm flex items-center justify-center gap-2"
        >
          챌린지 입장하기
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )
}
