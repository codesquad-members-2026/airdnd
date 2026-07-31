import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCreateWishlistMutation } from '../api/wishlistQueries';
import { ApiError } from '../../../shared/api/apiError';

export function CreateWishlistButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const createMutation = useCreateWishlistMutation();

  function close() {
    setIsOpen(false);
    setName('');
    createMutation.reset();
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    createMutation.mutate(trimmed, { onSuccess: close });
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        className="primary-button inline-action"
        onClick={() => setIsOpen(true)}
      >
        <Plus size={18} strokeWidth={2.4} aria-hidden />새 위시리스트
      </button>
    );
  }

  const error = createMutation.error;
  const isDuplicate = error instanceof ApiError && error.status === 409;

  return (
    <form className="wishlist-create-form" onSubmit={handleSubmit}>
      <input
        autoFocus
        value={name}
        maxLength={100}
        placeholder="위시리스트 이름"
        aria-label="새 위시리스트 이름"
        onChange={(event) => setName(event.target.value)}
      />
      <button
        type="submit"
        className="primary-button"
        disabled={createMutation.isPending || name.trim().length === 0}
      >
        {createMutation.isPending ? '만드는 중…' : '만들기'}
      </button>
      <button type="button" className="ghost-button" onClick={close}>
        취소
      </button>
      {isDuplicate ? (
        <span className="field-error full-row">이미 같은 이름의 위시리스트가 있습니다.</span>
      ) : null}
      {error && !isDuplicate ? (
        <span className="field-error full-row">위시리스트를 만들지 못했습니다. 다시 시도해 주세요.</span>
      ) : null}
    </form>
  );
}
