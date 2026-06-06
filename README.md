# 🏆 셀러루틴 (Selleroutine) - 프로덕션 서비스

온라인 셀러를 위한 핵심 실천 인증 및 기수제 챌린지 운영 SaaS 솔루션입니다. 본 프로젝트는 React, Tailwind CSS, Supabase를 기반으로 작동하며 오프라인 상태에서도 원활히 동작하도록 PWA(Progressive Web App) 규격이 적용되어 있습니다.

---

## 🚀 빠른 시작 (Local Execution)

### 1. 의존성 패키지 설치
```bash
npm install
```

### 2. 로컬 환경 변수 설정
프로젝트 루트 폴더에 `.env` 파일을 생성하고 Supabase Project API 정보를 입력합니다.
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```
> **주의**: Supabase 연동 정보가 설정되어 있지 않으면 웹앱 진입 시 오류 경고 및 연동 안내 가이드 화면이 렌더링됩니다.

### 3. 로컬 개발 서버 구동
```bash
npm run dev
```

### 4. PWA 빌드 및 배포 테스트
```bash
npm run build
npm run preview
```

---

## 💾 Supabase 데이터베이스 설정 (Database & Storage Setup)

Supabase 콘솔의 **SQL Editor**에 접속하여 아래 쿼리를 일괄 실행하면 테이블 구조, 자동 인덱스, 트리거, 그리고 보안을 위한 RLS(Row Level Security) 및 Storage 버킷 설정이 자동으로 설치됩니다.

> [!TIP]
> SQL 파일 원본은 [supabase_schema.sql](file:///c:/AI/sellerlab/supabase_schema.sql)에 보관되어 있습니다.

### 테이블 명세 및 RLS 정책
1. **profiles**: 회원 정보 및 권한 보관. 가입 시 기본 가입자는 `participant`로 자동 지정.
2. **challenges**: 챌린지 기수 관리. 운영자는 자신이 개설한 기수만 관리 및 조회.
3. **challenge_members**: 기수별 가입한 도전자 관계 매핑.
4. **missions**: 각 기수별 수행해야 할 루틴 미션 목록.
5. **mission_logs**: 도전자들의 일자별 미션 체크 여부, 메모, 증빙 URL, 업로드 이미지, 회고 보관.
6. **feedbacks**: 특정 미션 로그에 작성된 운영진의 멘토 피드백 코멘트.
7. **proof-images (Storage Bucket)**: 미션 인증 사진을 저장하는 비공개(Private) 버킷.

---

## 🔑 운영자(Admin) 권한 부여 가이드 (Administrator Guide)

회원 보안을 확보하기 위해 클라이언트 애플리케이션 단에서는 어떠한 유저도 임의로 `admin` 역할을 지정할 수 없도록 강제되어 있습니다.

### 1. 기본 회원가입
사용자가 회원가입 화면(`/signup`)을 통해 가입을 완료하면, Supabase Auth 트리거(`handle_new_user`)에 의해 `profiles` 테이블에 `role` 필드가 무조건 **`participant`**로 생성됩니다.

### 2. 최초 운영자(Admin) 지정 방법
서비스 운영을 위해 특정 계정에 `admin` 권한을 수동으로 양도해야 합니다. Supabase 콘솔의 **SQL Editor**에서 아래 SQL을 실행하여 계정 권한을 격상시킬 수 있습니다:

```sql
-- 특정 이메일을 가진 회원을 운영자(admin)로 승격
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';
```

---

## 📱 PWA (Progressive Web App) 안내

셀러루틴은 모바일 홈 화면에 독립 앱으로 추가하여 실제 설치 앱처럼 네이티브하게 구동할 수 있습니다.
- **Service Worker (`public/sw.js`)**: 네트워크 오프라인 장애 시 `public/offline.html` 안내 레이아웃으로 대체 표시하며 자산을 캐싱합니다.
- **Manifest (`public/manifest.json`)**: 스플래시 화면, 브랜드 주 테마 컬러(`theme_color: #4F46E5`), 독립형 스탠드얼론(`standalone`) 모바일 해상도 구동 스펙이 지정되어 있습니다.
- **PWA 오프라인 화면**: 네트워크에 차단되거나 외부 인프라 장애 발생 시 친근한 아이콘과 연결 확인용 "다시 연결하기" 조작 가이드 페이지가 자동으로 사용자에게 제공됩니다.
