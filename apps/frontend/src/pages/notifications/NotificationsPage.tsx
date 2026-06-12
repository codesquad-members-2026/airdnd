import { Bell } from 'lucide-react';
import { useNotificationsQuery } from '../../features/notifications/api/notificationsQueries';
import { ErrorMessage } from '../../shared/ui/ErrorMessage';
import { Loading } from '../../shared/ui/Loading';
import { StatusBadge } from '../../shared/ui/StatusBadge';

export function NotificationsPage() {
  const notificationsQuery = useNotificationsQuery();

  return (
    <section className="stack">
      <div className="page-heading">
        <p className="eyebrow">Notifications</p>
        <h1>알림</h1>
      </div>
      {notificationsQuery.isLoading ? <Loading message="알림을 불러오는 중입니다." /> : null}
      {notificationsQuery.error ? <ErrorMessage error={notificationsQuery.error} /> : null}
      {notificationsQuery.data ? (
        <div className="list-stack">
          {notificationsQuery.data.map((notification) => (
            <article className="message-card" key={notification.id}>
              <span className="brand-mark">
                <Bell size={18} />
              </span>
              <div>
                <h2>{notification.title}</h2>
                <p className="muted">{notification.message}</p>
              </div>
              {!notification.read ? <StatusBadge>NEW</StatusBadge> : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
