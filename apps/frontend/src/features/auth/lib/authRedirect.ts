const authReturnToKey = 'airdnd.auth.returnTo';

export type InternalLocation = {
  pathname: string;
  search?: string;
  hash?: string;
};

export function toInternalPath(location: InternalLocation | undefined) {
  if (!location?.pathname.startsWith('/') || location.pathname.startsWith('//')) {
    return '/';
  }

  return `${location.pathname}${location.search ?? ''}${location.hash ?? ''}`;
}

export function saveAuthReturnTo(path: string) {
  window.sessionStorage.setItem(authReturnToKey, isInternalPath(path) ? path : '/');
}

export function consumeAuthReturnTo() {
  const path = window.sessionStorage.getItem(authReturnToKey);
  window.sessionStorage.removeItem(authReturnToKey);
  return path && isInternalPath(path) ? path : '/';
}

function isInternalPath(path: string) {
  return path.startsWith('/') && !path.startsWith('//');
}
