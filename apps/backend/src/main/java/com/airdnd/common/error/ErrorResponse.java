package com.airdnd.common.error;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;

@Getter
public class ErrorResponse {

    private String code;
    private String message;
    private Object detail;

    @Builder(access = AccessLevel.PRIVATE)
    private ErrorResponse(String code, String message, Object detail){
        this.code = code;
        this.message = message;
        this.detail = detail;
    }

    public static ErrorResponse of(ErrorCode code){
        return ErrorResponse.builder().code(code.name()).message(code.getErrorMessage()).build();
    }
    public static ErrorResponse of(ErrorCode code, String customMessage){
        return ErrorResponse.builder().code(code.name()).message(customMessage).build();
    }
    public static ErrorResponse of(ErrorCode code, Object detail){
        return ErrorResponse.builder().code(code.name()).message(code.getErrorMessage()).detail(detail).build();
    }

}
