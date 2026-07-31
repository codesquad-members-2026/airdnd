import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  CreateReviewFormValues,
  REVIEW_COMMENT_MAX_LENGTH,
  createReviewFormSchema,
} from '../model/reviewTypes';
import { StarRatingInput } from './StarRatingInput';

interface ReviewFormProps {
  isSubmitting?: boolean;
  onSubmit: (values: CreateReviewFormValues) => void;
}

export function ReviewForm({ isSubmitting = false, onSubmit }: ReviewFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateReviewFormValues>({
    resolver: zodResolver(createReviewFormSchema),
    defaultValues: { rating: 0, comment: '' },
  });

  const commentLength = useWatch({ control, name: 'comment' })?.length ?? 0;

  return (
    <form className="review-form" onSubmit={handleSubmit(onSubmit)}>
      <div className="review-form__field">
        <span className="review-form__label">별점</span>
        <Controller
          control={control}
          name="rating"
          render={({ field }) => (
            <StarRatingInput value={field.value} onChange={field.onChange} disabled={isSubmitting} />
          )}
        />
        {errors.rating ? <span className="field-error">{errors.rating.message}</span> : null}
      </div>

      <div className="review-form__field">
        <label className="review-form__label" htmlFor="review-comment">
          후기
        </label>
        <textarea
          id="review-comment"
          rows={7}
          maxLength={REVIEW_COMMENT_MAX_LENGTH}
          placeholder="숙소는 어떠셨나요? 다른 게스트에게 도움이 될 솔직한 후기를 남겨 주세요."
          disabled={isSubmitting}
          {...register('comment')}
        />
        <div className="review-form__meta">
          {errors.comment ? (
            <span className="field-error">{errors.comment.message}</span>
          ) : (
            <span />
          )}
          <span className="review-form__count">
            {commentLength}/{REVIEW_COMMENT_MAX_LENGTH}
          </span>
        </div>
      </div>

      <button className="primary-button full-width" type="submit" disabled={isSubmitting}>
        {isSubmitting ? '등록 중…' : '후기 등록'}
      </button>
    </form>
  );
}
