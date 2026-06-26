package codesquad.airdnd.global.auth;

import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import codesquad.airdnd.global.exception.BusinessException;
import codesquad.airdnd.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class LoginArgumentResolver implements HandlerMethodArgumentResolver {
	private final AuthUtils authUtils;

	@Override
	public boolean supportsParameter(MethodParameter parameter) {
		return parameter.hasParameterAnnotation(CurrentMember.class)
			&& parameter.getParameterType().equals(CurrentMemberInfo.class);
	}

	@Override
	public CurrentMemberInfo resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
		NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {

		// 익명으로 그냥 두면 404를 반환함
		try {
			return new CurrentMemberInfo(authUtils.getCurrentMember().getId());
		} catch (BusinessException e) {
			if (e.getErrorCode() == ErrorCode.MEMBER_NOT_FOUND) {
				return new CurrentMemberInfo(null);
			}
			throw e;
		}
	}
}
