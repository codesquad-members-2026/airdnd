package com.airdnd.common.exception;

import com.airdnd.common.error.ErrorCode;
import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {

    private ErrorCode code;

    public BusinessException(ErrorCode code) {
        super(code.getErrorMessage());
        this.code = code;
    }

    public BusinessException(ErrorCode code, String customMessage) {
        super(customMessage);
        this.code = code;
    }
}
