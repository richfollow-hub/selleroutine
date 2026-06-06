import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const ProtectedRoute = ({ requiredRole }) => {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && (!profile || profile.role !== requiredRole)) {
    if (requiredRole === 'admin') {
      return <Navigate to="/dashboard" replace />
    }
    if (profile && profile.role === 'admin') {
      return <Navigate to="/admin" replace />
    }
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
