import { useState, useEffect } from 'react'
import { getSignedImageUrl } from '../lib/api'
import { Loader2, ImageOff } from 'lucide-react'

export default function SecureImage({ src, alt, className }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!src) {
      setLoading(false)
      return
    }
    
    // Check if the URL is an external web link or a base64 string
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
      setUrl(src)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    setError(false)
    
    getSignedImageUrl(src)
      .then((signedUrl) => {
        if (active) {
          setUrl(signedUrl)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('Error resolving secure image path:', err)
        if (active) {
          setError(true)
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [src])

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 ${className || 'h-32 rounded-lg'}`}>
        <Loader2 className="animate-spin text-slate-400" size={16} />
      </div>
    )
  }

  if (error || !url) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-100 text-slate-400 gap-1 ${className || 'h-32 rounded-lg'}`}>
        <ImageOff size={16} />
        <span className="text-[9px] font-medium">이미지를 불러올 수 없음</span>
      </div>
    )
  }

  return <img src={url} alt={alt} className={className} loading="lazy" />
}
