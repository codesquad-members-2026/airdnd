import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../../shared/api/config';
import { useToast } from '../../shared/Toast';

/** 백엔드 SignupRequest 검증 규칙과 동일하게 맞춘 정규식 */
const RULES = {
  userId: {
    re: /^[a-zA-Z][a-zA-Z0-9_]{3,19}$/,
    msg: '아이디는 영문자로 시작하는 4~20자의 영문/숫자/밑줄(_)이어야 합니다.',
  },
  password: {
    re: /^(?=.*[A-Za-z])(?=.*\d).{8,20}$/,
    msg: '비밀번호는 영문과 숫자를 포함한 8~20자여야 합니다.',
  },
  nickname: {
    re: /^[a-zA-Z0-9가-힣]{2,20}$/,
    msg: '닉네임은 영문/숫자/한글 2~20자여야 합니다.',
  },
} as const;

type Field = keyof typeof RULES;

/** ApiResponse 에러 응답 형태 (백엔드 global.ApiResponse) */
interface ApiErrorBody {
  code?: string;
  message?: string;
  errors?: { field: string; reason: string }[];
}

/**
 * 회원 가입 페이지 (POST /api/auth/signup).
 * 아이디/비밀번호/닉네임을 JSON 으로 보내고, 백엔드 검증 규칙을 프론트에서도 선검증한다.
 */
export function SignupPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [values, setValues] = useState<Record<Field, string>>({
    userId: '',
    password: '',
    nickname: '',
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (f: Field, v: string) => {
    setValues((prev) => ({ ...prev, [f]: v }));
    if (errors[f]) setErrors((prev) => ({ ...prev, [f]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<Field, string>> = {};
    (Object.keys(RULES) as Field[]).forEach((f) => {
      if (!RULES[f].re.test(values[f])) next[f] = RULES[f].msg;
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (submitting || !validate()) return;
    setSubmitting(true);
    try {
          const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: values.userId,
          password: values.password,
          nickname: values.nickname,
        }),
        credentials: 'include',
      });

      if (res.status === 201) {
        // 가입 성공 — 가입 후엔 로그인되지 않은 상태이므로 홈으로 이동 후 로그인 유도
        toast.success('회원가입이 완료되었어요. 로그인해 주세요.');
        navigate('/', { replace: true });
        return;
      }

      // 에러 응답 매핑
      const body: ApiErrorBody = await res.json().catch(() => ({}));
      if (body.code === 'MEMBER_003') {
        setErrors((prev) => ({ ...prev, userId: body.message ?? '이미 사용 중인 아이디입니다.' }));
      } else if (body.code === 'MEMBER_004') {
        setErrors((prev) => ({ ...prev, nickname: body.message ?? '이미 사용 중인 닉네임입니다.' }));
      } else if (body.errors?.length) {
        // 검증 실패(400) — 필드별 메시지 반영
        const next: Partial<Record<Field, string>> = {};
        body.errors.forEach((e) => {
          if (e.field in RULES) next[e.field as Field] = e.reason;
        });
        setErrors((prev) => ({ ...prev, ...next }));
      } else {
        setFormError(body.message ?? '회원 가입에 실패했어요. 잠시 후 다시 시도해 주세요.');
      }
    } catch {
      setFormError('회원 가입 요청에 실패했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    values.userId.length > 0 &&
    values.password.length > 0 &&
    values.nickname.length > 0 &&
    !submitting;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--surface-alt)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          width: 480,
          maxWidth: '100%',
          boxShadow: 'var(--shadow-lg)',
          padding: 32,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <BrandMark />
        </div>
        <h1
          style={{
            margin: 0,
            textAlign: 'center',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--ink-strong)',
          }}
        >
          회원 가입
        </h1>

        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FieldInput
            label="아이디"
            value={values.userId}
            placeholder="영문으로 시작하는 4~20자"
            autoComplete="username"
            error={errors.userId}
            onChange={(v) => set('userId', v)}
          />
          <FieldInput
            label="비밀번호"
            type="password"
            value={values.password}
            placeholder="영문과 숫자를 포함한 8~20자"
            autoComplete="new-password"
            error={errors.password}
            onChange={(v) => set('password', v)}
          />
          <FieldInput
            label="닉네임"
            value={values.nickname}
            placeholder="영문/숫자/한글 2~20자"
            autoComplete="nickname"
            error={errors.nickname}
            onChange={(v) => set('nickname', v)}
            onEnter={handleSubmit}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            marginTop: 24,
            width: '100%',
            height: 52,
            border: 'none',
            borderRadius: 10,
            background: canSubmit
              ? 'linear-gradient(to right, #E61E4D, #E31C5F 50%, #D70466)'
              : 'var(--surface-alt-2)',
            color: canSubmit ? '#fff' : 'var(--ink-4)',
            fontFamily: 'var(--font-sans)',
            fontSize: 16,
            fontWeight: 700,
            cursor: canSubmit ? 'pointer' : 'default',
          }}
        >
          {submitting ? '가입 중...' : '가입하기'}
        </button>

        {formError && (
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--brand-coral)', textAlign: 'center' }}>
            {formError}
          </div>
        )}

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--ink-3)' }}>
          이미 계정이 있으신가요?{' '}
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--ink-1)',
              textDecoration: 'underline',
            }}
          >
            로그인
          </button>
        </div>
      </div>
    </div>
  );
}

interface FieldInputProps {
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  error?: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
}

function FieldInput({ label, value, placeholder, type, autoComplete, error, onChange, onEnter }: FieldInputProps) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? 'var(--brand-coral)' : focused ? 'var(--ink-1)' : 'var(--line-strong)';
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 6 }}>
        {label}
      </label>
      <input
        value={value}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onEnter) onEnter();
        }}
        style={{
          width: '100%',
          height: 52,
          padding: '0 16px',
          boxSizing: 'border-box',
          borderRadius: 10,
          border: `1px solid ${borderColor}`,
          outline: 'none',
          fontFamily: 'var(--font-sans)',
          fontSize: 15,
          color: 'var(--ink-1)',
        }}
      />
      {error && <div style={{ marginTop: 6, fontSize: 12, color: 'var(--brand-coral)' }}>{error}</div>}
    </div>
  );
}

/** 코랄 삼각형 브랜드 마크 (로고에서 심볼만 추출) */
function BrandMark() {
  return (
    <svg viewBox="0 0 72 72" width="40" height="40" aria-hidden>
      <rect x="8" y="8" width="56" height="56" rx="14.6" fill="#E84C60" />
      <polygon points="36,19.2 19.2,52.8 52.8,52.8" fill="#fff" />
      <polygon points="36,33.7 30.4,52.8 41.6,52.8" fill="#E84C60" />
    </svg>
  );
}
