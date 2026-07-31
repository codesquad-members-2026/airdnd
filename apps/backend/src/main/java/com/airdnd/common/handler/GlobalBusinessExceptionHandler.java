package com.airdnd.common.handler;

import com.airdnd.common.error.ErrorCode;
import com.airdnd.common.error.ErrorResponse;
import com.airdnd.common.exception.BusinessException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Optional;

@RestControllerAdvice
public class GlobalBusinessExceptionHandler{

    @ExceptionHandler(BusinessException.class)
    private ResponseEntity<ErrorResponse> handleBusinessException(BusinessException exception){
        ErrorCode code = exception.getCode();
        ErrorResponse response = ErrorResponse.of(code, exception.getMessage());
        return ResponseEntity.status(code.getStatus()).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    private ResponseEntity<ErrorResponse> handleMethodArgumentNotValidException(MethodArgumentNotValidException exception){
        ErrorCode code = ErrorCode.VALIDATION_FAILED;

        String customMessage = Optional.ofNullable(exception.getBindingResult().getFieldError())
                .map(FieldError::getDefaultMessage)
                .orElse(code.getErrorMessage());
        ErrorResponse response = ErrorResponse.of(code, customMessage);

        return ResponseEntity.status(code.getStatus()).body(response);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    private ResponseEntity<ErrorResponse> handleHttpMessageNotReadableException() {
        ErrorCode code = ErrorCode.VALIDATION_FAILED;
        ErrorResponse response = ErrorResponse.of(code, "요청 값의 형식이 올바르지 않습니다.");

        return ResponseEntity.status(code.getStatus()).body(response);
    }

    @ExceptionHandler(PessimisticLockingFailureException.class)
    private ResponseEntity<ErrorResponse> handlePessimisticLockingFailureException(PessimisticLockingFailureException exception){
        ErrorCode code = ErrorCode.RESERVATION_LOCK_TIMEOUT;
        ErrorResponse response = ErrorResponse.of(code, code.getErrorMessage());
        return ResponseEntity.status(code.getStatus()).body(response);
    }

}
