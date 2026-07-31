import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import {
  useNotificationActions,
  useNotificationUnreadCountQuery,
  useNotificationsQuery,
} from '../api/notificationsQueries';
import type { Notification } from '../model/notificationTypes';
import { NOTIFICATION_TYPE_ICON } from '../lib/notificationIcon';
import { formatRelativeTime } from '../../../shared/lib/format';

// 드롭다운에 노출할 최근 알림 개수
const PREVIEW_COUNT = 5;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const notificationsQuery = useNotificationsQuery();
  const unreadCountQuery = useNotificationUnreadCountQuery();
  const { markRead, markAllRead } = useNotificationActions();
  // 벨 버튼 + 드롭다운을 함께 감싸는 래퍼. 이 바깥을 누르면 닫는다(계정 메뉴와 동일 패턴).
  const containerRef = useRef<HTMLDivElement>(null);

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = unreadCountQuery.data ?? 0;
  const preview = notifications.slice(0, PREVIEW_COUNT);

  function close() {
    setOpen(false);
  }

  // 열려 있을 때만 바깥 클릭(pointerdown)·Esc 로 닫는다. 백드롭과 달리 stacking context 영향이 없고,
  // 클릭한 대상(다른 링크 등)도 그대로 동작한다.
  useEffect(() => {
    if (!open) {
      return;
    }
    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  // 알림 클릭: 안읽음이면 읽음 처리하고, 연결된 화면이 있으면 이동한다.
  function handleItemClick(notification: Notification) {
    if (!notification.read) {
      markRead(notification.id);
    }
    close();
    if (notification.redirectUrl) {
      navigate(notification.redirectUrl);
    }
  }

  return (
    <div className="notif-bell" ref={containerRef}>
      <button
        className="host-cta header-bell"
        type="button"
        aria-label="알림"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={20} />
        {unreadCount > 0 ? (
          <span className="header-bell__count" aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      <div className={`notif-dropdown ${open ? 'open' : ''}`} role="dialog" aria-label="알림 패널">
        <div className="notif-dropdown__head">
          <span className="notif-dropdown__title">알림</span>
          {unreadCount > 0 ? (
            <button className="notif-dropdown__mark" type="button" onClick={markAllRead}>
              모두 읽음 표시
            </button>
          ) : null}
        </div>

        <div className="notif-dropdown__body">
          {preview.length > 0 ? (
            preview.map((notification) => {
              const Icon = NOTIFICATION_TYPE_ICON[notification.type];
              return (
                <button
                  className={`notif-dropdown__item ${notification.read ? '' : 'unread'}`}
                  type="button"
                  key={notification.id}
                  onClick={() => handleItemClick(notification)}
                >
                  <span
                    className={`notif-dropdown__item-icon notif-dropdown__item-icon--${notification.type.toLowerCase()}`}
                    aria-hidden="true"
                  >
                    <Icon size={18} />
                  </span>
                  <span className="notif-dropdown__item-body">
                    <span className="notif-dropdown__item-msg">{notification.content}</span>
                    <span className="notif-dropdown__item-time">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </span>
                  {!notification.read ? (
                    <span className="notif-dropdown__item-dot" aria-hidden="true" />
                  ) : null}
                </button>
              );
            })
          ) : (
            <p className="notif-dropdown__empty">알림이 없어요</p>
          )}
        </div>

        <div className="notif-dropdown__footer">
          <Link className="notif-dropdown__all-link" to="/notifications" onClick={close}>
            알림 전체 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
