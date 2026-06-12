import { UserRole } from '../model/authTypes';

export function canAccessHost(role: UserRole) {
  return role === 'HOST' || role === 'ADMIN';
}

export function canAccessAdmin(role: UserRole) {
  return role === 'ADMIN';
}

export function getRoleLabel(role: UserRole) {
  const labels: Record<UserRole, string> = {
    GUEST: '게스트',
    HOST: '호스트',
    ADMIN: '관리자',
  };

  return labels[role];
}
