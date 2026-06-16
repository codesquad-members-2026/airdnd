package codesquad.airdnd.global.exception;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import codesquad.airdnd.global.ApiResponse;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(BusinessException.class)
	public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException e) {
		ErrorCode ec = e.getErrorCode();
		return ResponseEntity.status(ec.getHttpStatus())
			.body(ApiResponse.error(ec));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException e) {
		ErrorCode errorCode = ErrorCode.INVALID_INPUT_VALUE;

		List<ApiResponse.FieldError> errors = ApiResponse.FieldError.of(e.getBindingResult());

		log.warn("Validation failed: {}", errors);

		return ResponseEntity
			.status(errorCode.getHttpStatus())
			.body(ApiResponse.error(errorCode, errors));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
		ErrorCode ec = ErrorCode.INTERNAL_SERVER_ERROR;

		log.error("Unhandled exception", e);

		return ResponseEntity
			.status(ec.getHttpStatus())
			.body(ApiResponse.error(ec));
	}
}
