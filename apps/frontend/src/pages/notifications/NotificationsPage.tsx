import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellOff } from 'lucide-react';
import {
  useNotificationActions,
  useNotificationUnreadCountQuery,
  useNotificationsQuery,
} from '../../features/notifications/api/notificationsQueries';
import type { Notification } from '../../features/notifications/model/notificationTypes';
import { NOTIFICATION_TYPE_ICON } from '../../features/notifications/lib/notificationIcon';
import { ErrorMessage } from '../../shared/ui/ErrorMessage';
import { Loading } from '../../shared/ui/Loading';
import { formatRelativeTime } from '../../shared/lib/format';

type Tab = 'all' | 'unread' | 'read';

export function NotificationsPage() {
  const navigate = useNavigate();
  const notificationsQuery = useNotificationsQuery();
  const unreadCountQuery = useNotificationUnreadCountQuery();
  const { markRead, markAllRead } = useNotificationActions();
  const [tab, setTab] = useState<Tab>('all');

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = unreadCountQuery.data ?? 0;

  // 알림 클릭: 안읽음이면 읽음 처리하고, 연결된 화면이 있으면 이동한다.
  function handleItemClick(notification: Notification) {
    if (!notification.read) {
      markRead(notification.id);
    }
    if (notification.redirectUrl) {
      navigate(notification.redirectUrl);
    }
  }

  const shown =
    tab === 'unread'
      ? notifications.filter((notification) => !notification.read)
      : tab === 'read'
        ? notifications.filter((notification) => notification.read)
        : notifications;
  const emptyMessage =
    tab === 'unread' ? '안 읽은 알림이 없어요' : tab === 'read' ? '읽은 알림이 없어요' : '알림이 없어요';

  return (
    <section className="notifications-page">
      <div className="notif-head-row">
        <div className="page-heading">
          <p className="eyebrow">Notifications</p>
          <h1>알림</h1>
          <p className="muted">예약 소식과 새 메시지를 한곳에서 확인하세요.</p>
        </div>
        {unreadCount > 0 ? (
          <button className="notif-mark-all" type="button" onClick={markAllRead}>
            모두 읽음 표시
          </button>
        ) : null}
      </div>

      <div className="notif-tabs" role="tablist">
        <button
          className={`notif-tab ${tab === 'all' ? 'active' : ''}`}
          role="tab"
          aria-selected={tab === 'all'}
          type="button"
          onClick={() => setTab('all')}
        >
          전체
        </button>
        <button
          className={`notif-tab ${tab === 'unread' ? 'active' : ''}`}
          role="tab"
          aria-selected={tab === 'unread'}
          type="button"
          onClick={() => setTab('unread')}
        >
          안읽음
          {unreadCount > 0 ? <span className="notif-tab-badge">{unreadCount}</span> : null}
        </button>
        <button
          className={`notif-tab ${tab === 'read' ? 'active' : ''}`}
          role="tab"
          aria-selected={tab === 'read'}
          type="button"
          onClick={() => setTab('read')}
        >
          읽음
        </button>
      </div>

      {notificationsQuery.isLoading ? <Loading message="알림을 불러오는 중입니다." /> : null}
      {notificationsQuery.error ? <ErrorMessage error={notificationsQuery.error} /> : null}

      {notificationsQuery.data ? (
        shown.length > 0 ? (
          <div className="notif-list" role="list">
            {shown.map((notification) => {
              const Icon = NOTIFICATION_TYPE_ICON[notification.type];
              // content는 "제목\n메시지" 규약. 첫 줄은 제목, 나머지는 메시지로 나눈다.
              const [title, ...rest] = notification.content.split('\n');
              const message = rest.join('\n').trim();
              return (
                <article
                  className={`notif-card notif-card--${notification.type.toLowerCase()} notif-card--clickable ${
                    notification.read ? 'is-read' : 'is-unread'
                  }`}
                  role="listitem"
                  key={notification.id}
                  tabIndex={0}
                  onClick={() => handleItemClick(notification)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleItemClick(notification);
                    }
                  }}
                >
                  <div
                    className={`notif-icon notif-icon--${notification.type.toLowerCase()}`}
                    aria-hidden="true"
                  >
                    <Icon size={22} />
                  </div>
                  <div className="notif-card__info">
                    <p className="notif-card__title">{title}</p>
                    {message ? <p className="notif-card__message">{message}</p> : null}
                  </div>
                  <div className="notif-card__side">
                    {!notification.read ? (
                      <span className="notif-card__dot" aria-hidden="true" />
                    ) : null}
                    <time className="notif-card__time">
                      {formatRelativeTime(notification.createdAt)}
                    </time>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="notif-empty" role="status">
            <BellOff size={40} />
            <p>{emptyMessage}</p>
          </div>
        )
      ) : null}
    </section>
  );
}
