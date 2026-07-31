import { useState } from 'react';
import { uploadRoomImage } from '../api/hostApi';

type RoomImageUploaderProps = {
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
};

// 숙소 이미지 업로드 위젯. 파일을 고르면 S3 로 업로드하고, 업로드된 publicUrl 목록을 상위 폼에 전달한다.
// value[0] 이 대표 이미지이며, "대표로" 버튼으로 순서를 바꿔 지정한다.
export function RoomImageUploader({ value, onChange, disabled }: RoomImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(fileList)) {
        uploadedUrls.push(await uploadRoomImage(file));
      }
      onChange([...value, ...uploadedUrls]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  }

  function removeAt(index: number) {
    onChange(value.filter((_, currentIndex) => currentIndex !== index));
  }

  function makeRepresentative(index: number) {
    if (index === 0) {
      return;
    }
    const next = [...value];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    onChange(next);
  }

  const isDisabled = disabled || isUploading;

  return (
    <div className="room-image-uploader">
      <label
        className={`room-image-dropzone${isDragging ? ' is-dragging' : ''}${isDisabled ? ' is-disabled' : ''}`}
        onDragOver={(event) => {
          if (isDisabled) {
            return;
          }
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          if (isDisabled) {
            return;
          }
          event.preventDefault();
          setIsDragging(false);
          void handleFiles(event.dataTransfer.files);
        }}
      >
        <input
          type="file"
          className="room-image-dropzone__input"
          aria-label="숙소 이미지 업로드"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={isDisabled}
          onChange={(event) => {
            void handleFiles(event.target.files);
            // 같은 파일을 다시 선택해도 onChange 가 발생하도록 초기화한다.
            event.target.value = '';
          }}
        />
        <span className="room-image-dropzone__icon" aria-hidden="true">
          {isUploading ? (
            <svg viewBox="0 0 24 24" className="room-image-dropzone__spinner" width="28" height="28">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="40 16" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4" />
              <path d="m7 9 5-5 5 5" />
              <path d="M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
            </svg>
          )}
        </span>
        <span className="room-image-dropzone__title">
          {isUploading ? '업로드 중...' : '사진을 끌어다 놓거나 클릭해 업로드'}
        </span>
        <span className="room-image-dropzone__hint">
          JPEG · PNG · WebP · 첫 번째 사진이 대표 이미지로 사용됩니다.
        </span>
      </label>

      {error ? <span className="field-error">{error}</span> : null}

      {value.length > 0 ? (
        <ul className="room-image-preview-grid">
          {value.map((url, index) => (
            <li key={url} className="room-image-preview">
              <img src={url} alt={`숙소 이미지 ${index + 1}`} />
              {index === 0 ? <span className="room-image-badge">대표</span> : null}
              <div className="room-image-preview-actions">
                {index !== 0 ? (
                  <button type="button" onClick={() => makeRepresentative(index)} disabled={disabled}>
                    대표로
                  </button>
                ) : null}
                <button type="button" onClick={() => removeAt(index)} disabled={disabled}>
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
