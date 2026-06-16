package codesquad.airdnd.global;

import java.util.List;

import org.springframework.validation.BindingResult;

import com.fasterxml.jackson.annotation.JsonInclude;

import codesquad.airdnd.global.exception.ErrorCode;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ApiResponse<T> {
	private final boolean success;
	private final String code;
	private final T data;
	private final String message;
	private final List<FieldError> errors;

	public static <T> ApiResponse<T> success(T data) {
		return new ApiResponse<>(true, "SUCCESS", data, null, null);
	}

    public static ApiResponse<Void> success(){ return new ApiResponse<>(true, "SUCCESS", null, null, null); }

	public static ApiResponse<Void> error(ErrorCode ec) {
		return new ApiResponse<>(false, ec.getCode(), null, ec.getMessage(), null);
	}

	public static ApiResponse<Void> error(ErrorCode ec, List<FieldError> errors) {
		return new ApiResponse<>(false, ec.getCode(), null, ec.getMessage(), errors);
	}

	@Getter
	@AllArgsConstructor(access = AccessLevel.PRIVATE)
	public static class FieldError {
		private final String field;
		private final String value;
		private final String reason;

		public static List<FieldError> of(BindingResult bindingResult) {
			return bindingResult.getFieldErrors().stream()
				.map(error -> new FieldError(
					error.getField(),
					error.getRejectedValue() == null ? "" : error.getRejectedValue().toString(),
					error.getDefaultMessage()))
				.toList();
		}
	}
}
