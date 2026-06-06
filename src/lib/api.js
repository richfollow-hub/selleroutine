import { supabase } from './supabase'

// --- Profile APIs ---
export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export const createProfile = async (profileData) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert([profileData])
    .select()
    .single()
  if (error) throw error
  return data
}

// --- Challenge APIs ---
export const getChallenges = async () => {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .order('start_date', { ascending: false })
  if (error) throw error
  return data
}

export const getAdminChallenges = async (adminId) => {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('created_by', adminId)
    .order('start_date', { ascending: false })
  if (error) throw error
  return data
}

export const createChallenge = async (challengeData) => {
  const { data, error } = await supabase
    .from('challenges')
    .insert([challengeData])
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateChallenge = async (challengeId, challengeData) => {
  const { data, error } = await supabase
    .from('challenges')
    .update(challengeData)
    .eq('id', challengeId)
    .select()
    .single()
  if (error) throw error
  return data
}

// --- Challenge Member APIs ---
export const getChallengeMembers = async (challengeId) => {
  const { data, error } = await supabase
    .from('challenge_members')
    .select('*, profiles(id, name, email, role)')
    .eq('challenge_id', challengeId)
  if (error) throw error
  return data
}

export const getUserChallengeMemberships = async (userId) => {
  const { data, error } = await supabase
    .from('challenge_members')
    .select('*, challenges(*)')
    .eq('user_id', userId)
  if (error) throw error
  return data
}

export const joinChallenge = async (challengeId, userId, role = 'participant') => {
  const { data, error } = await supabase
    .from('challenge_members')
    .insert([{ challenge_id: challengeId, user_id: userId, role }])
    .select()
    .single()
  if (error) throw error
  return data
}

// --- Mission APIs ---
export const getMissions = async (challengeId) => {
  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .eq('challenge_id', challengeId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

export const createMission = async (missionData) => {
  const { data, error } = await supabase
    .from('missions')
    .insert([missionData])
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateMission = async (missionId, missionData) => {
  const { data, error } = await supabase
    .from('missions')
    .update(missionData)
    .eq('id', missionId)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteMission = async (missionId) => {
  const { error } = await supabase
    .from('missions')
    .delete()
    .eq('id', missionId)
  if (error) throw error
  return true
}

// --- Mission Log APIs ---
export const getMissionLogsForDate = async (challengeId, logDate) => {
  const { data, error } = await supabase
    .from('mission_logs')
    .select('*, profiles(name, email)')
    .eq('challenge_id', challengeId)
    .eq('log_date', logDate)
  if (error) throw error
  return data
}

export const getParticipantLogs = async (userId, challengeId) => {
  const { data, error } = await supabase
    .from('mission_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .order('log_date', { ascending: false })
  if (error) throw error
  return data
}

export const upsertMissionLog = async (logData) => {
  const { data, error } = await supabase
    .from('mission_logs')
    .upsert([logData], { onConflict: 'challenge_id,mission_id,user_id,log_date' })
    .select()
    .single()
  if (error) throw error
  return data
}

// --- Feedback APIs ---
export const getFeedbacksForParticipant = async (participantId) => {
  const { data, error } = await supabase
    .from('feedbacks')
    .select('*, mission_logs(log_date, missions(title))')
    .eq('participant_id', participantId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const getFeedbacksForLog = async (missionLogId) => {
  const { data, error } = await supabase
    .from('feedbacks')
    .select('*')
    .eq('mission_log_id', missionLogId)
  if (error) throw error
  return data
}

export const createFeedback = async (feedbackData) => {
  const { data, error } = await supabase
    .from('feedbacks')
    .insert([feedbackData])
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateFeedback = async (feedbackId, comment) => {
  const { data, error } = await supabase
    .from('feedbacks')
    .update({ comment, updated_at: new Date().toISOString() })
    .eq('id', feedbackId)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteFeedback = async (feedbackId) => {
  const { error } = await supabase
    .from('feedbacks')
    .delete()
    .eq('id', feedbackId)
  if (error) throw error
  return true
}

// --- Product Ideas APIs ---
export const getProductIdeas = async (userId) => {
  const { data, error } = await supabase
    .from('product_ideas')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const createProductIdea = async (ideaData) => {
  const { data, error } = await supabase
    .from('product_ideas')
    .insert([ideaData])
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteProductIdea = async (ideaId) => {
  const { error } = await supabase
    .from('product_ideas')
    .delete()
    .eq('id', ideaId)
  if (error) throw error
  return true
}

// --- Keyword Notes APIs ---
export const getKeywordNotes = async (userId) => {
  const { data, error } = await supabase
    .from('keyword_notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const createKeywordNote = async (kwData) => {
  const { data, error } = await supabase
    .from('keyword_notes')
    .insert([kwData])
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteKeywordNote = async (kwId) => {
  const { error } = await supabase
    .from('keyword_notes')
    .delete()
    .eq('id', kwId)
  if (error) throw error
  return true
}

// --- Seed Default Missions ---
export const seedDefaultMissions = async (challengeId) => {
  const defaultMissions = [
    { title: '상품 리서치 1개', description: '인기 플랫폼에서 팔릴 만한 신제품 리서치', sort_order: 1 },
    { title: '키워드 10개 찾기', description: '아이템스카우트 등을 이용한 소형 키워드 발굴', sort_order: 2 },
    { title: '경쟁상품 3개 분석', description: '상위 판매처 리뷰 및 가격 포지셔닝 분석', sort_order: 3 },
    { title: '상품 1개 등록 또는 수정', description: '스마트스토어/쿠팡 상품 상세 등록 완료', sort_order: 4 },
    { title: '상세페이지 1개 개선', description: '소구점 추가, 메인 썸네일 개선 작업', sort_order: 5 },
    { title: '리뷰/문의 확인', description: 'CS 문의 답변 및 고객 리뷰 피드백 확인', sort_order: 6 },
    { title: 'SNS/블로그 홍보 1개', description: '마케팅용 블로그 또는 카페 바이럴 작성', sort_order: 7 },
    { title: '매출/방문자 수 기록', description: '어제 자 정산 대시보드 지표 통계 시트 기록', sort_order: 8 }
  ]
  
  const missionsWithChallenge = defaultMissions.map(m => ({
    ...m,
    challenge_id: challengeId,
    is_active: true
  }))

  const { data, error } = await supabase
    .from('missions')
    .insert(missionsWithChallenge)
    .select()
  if (error) throw error
  return data
}

// --- Storage APIs (proof-images Bucket) ---
export const uploadProofImage = async (file, userId, challengeId, logDate) => {
  const fileExt = file.name.split('.').pop()
  const randomStr = Math.random().toString(36).substring(2, 10)
  const fileName = `${randomStr}_${Date.now()}.${fileExt}`
  const filePath = `${userId}/${challengeId}/${logDate}/${fileName}`

  const { data, error } = await supabase.storage
    .from('proof-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })
  
  if (error) throw error
  return data.path // Returns relative path to use inside database
}

export const getSignedImageUrl = async (filePath) => {
  if (!filePath) return null
  const { data, error } = await supabase.storage
    .from('proof-images')
    .createSignedUrl(filePath, 3600) // 1 hour validity
  
  if (error) throw error
  return data.signedUrl
}

