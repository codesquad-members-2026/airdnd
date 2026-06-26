import { useNavigate } from 'react-router-dom';
import { Section, InfoField, ExpandableText, LinkRow } from './primitives';

export function ReservationDetailsSection({
  guestSummary,
  reservationId,
}: {
  guestSummary: string;
  reservationId: number;
}) {
  const navigate = useNavigate();
  return (
    <Section title="예약 세부정보">
      <InfoField label="누가 오나요" value={guestSummary} />
      <InfoField label="확인 코드" value="HMM3HMFCP9" />

      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>취소 정책</div>
      <ExpandableText text="체크인 48시간 전까지 무료 취소할 수 있습니다. 6월 27일 오후 3:00 이후에 취소하면 1박 요금과 수수료를 제외한 금액이 부분 환불됩니다. 자세한 내용은 호스트의 취소 정책을 확인하세요." />

      <div style={{ marginTop: 12 }}>
        <LinkRow icon="edit-3" label="예약 변경" />
        <LinkRow
          icon="x"
          label="예약 취소"
          onClick={() => navigate(`/trips/reservation/${reservationId}/cancel`)}
        />
        <LinkRow icon="image" label="모든 용도의 PDF 받기" />
        <LinkRow icon="image" label="세부정보 인쇄" />
        <LinkRow icon="credit-card" label="영수증 받기" />
      </div>
    </Section>
  );
}
