import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loading } from '../../shared/ui/Loading';
import { useCurrentUserQuery } from '../../features/auth/api/authQueries';
import { canAccessAdmin, canAccessHost } from '../../features/auth/lib/authAccess';
import { UserRole } from '../../features/auth/model/authTypes';

type ProtectedRouteProps = {
  allowedRoles?: UserRole[];
};

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const { data: user, isLoading } = useCurrentUserQuery();

  if (isLoading) {
    return <Loading message="로그인 상태를 확인하는 중입니다." />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const canAccessAllowedRole =
    !allowedRoles ||
    allowedRoles.includes(user.role) ||
    (allowedRoles.includes('HOST') && canAccessHost(user.role)) ||
    (allowedRoles.includes('ADMIN') && canAccessAdmin(user.role));

  if (!canAccessAllowedRole) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}
