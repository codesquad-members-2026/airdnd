import { request } from '../../../shared/api/httpClient';
import { User, userSchema } from '../model/authTypes';

export async function getCurrentUser() {
  const data = await request<User | null>('/api/auth/me');

  if (data) {
    return userSchema.parse(data);
  }

  return null;
}

export async function logout() {
  await request<void>('/api/auth/logout', {
    method: 'POST',
  });
}

export async function activateHost() {
  const data = await request<User>('/api/members/me/host-activation', {
    method: 'POST',
  });

  return userSchema.parse(data);
}
