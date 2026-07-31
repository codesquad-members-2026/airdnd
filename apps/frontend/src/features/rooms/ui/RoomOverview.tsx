import type { ReactNode } from 'react';
import { Baby, PawPrint, Users, UserRound } from 'lucide-react';
import { RoomDetail } from '../model/roomTypes';
import { RoomReviewSummaryButton } from '../../reviews/ui/RoomReviewSummaryButton';

type Highlight = {
  icon: ReactNode;
  title: string;
  description: string;
};

export function RoomOverview({ room }: { room: RoomDetail }) {
  const highlights: Highlight[] = [
    {
      icon: <Users size={26} strokeWidth={1.5} />,
      title: `최대 게스트 ${room.maxGuests}명`,
      description: '편안하게 머무를 수 있는 인원입니다.',
    },
    {
      icon: <PawPrint size={26} strokeWidth={1.5} />,
      title: room.allowsPets ? '반려동물 동반 가능' : '반려동물 동반 불가',
      description: room.allowsPets
        ? '반려동물과 함께 숙박하실 수 있어요.'
        : '반려동물은 동반하실 수 없어요.',
    },
    {
      icon: <Baby size={26} strokeWidth={1.5} />,
      title: room.allowsInfants ? '유아 동반 가능' : '유아 동반 불가',
      description: room.allowsInfants
        ? '유아를 위한 숙박이 가능해요.'
        : '유아 동반은 어려운 숙소예요.',
    },
  ];

  return (
    <div className="room-overview">
      {/* 호스트 정보 (아이콘 + 이름을 한 줄로 묶어 컴팩트하게) */}
      <div className="room-overview-host">
        <UserRound size={44} strokeWidth={1} className="room-overview-host__avatar" />
        <span className="room-overview-host__name">호스트 {room.hostName}</span>
      </div>

      {/* 평점·후기 요약 버튼 (클릭 시 후기 섹션으로 스크롤) */}
      <div className="room-overview-review">
        <RoomReviewSummaryButton rating={room.rating} reviewCount={room.reviewCount} fullWidth />
      </div>

      {/* 숙소 하이라이트 (가로 2개씩 배치) */}
      <div className="room-overview-highlights">
        {highlights.map((highlight) => (
          <div key={highlight.title} className="room-highlight">
            <div className="room-highlight__icon">{highlight.icon}</div>
            <div>
              <h3 className="room-highlight__title">{highlight.title}</h3>
              <p className="room-highlight__desc">{highlight.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
