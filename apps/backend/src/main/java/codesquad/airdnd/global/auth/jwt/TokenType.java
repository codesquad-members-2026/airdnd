package codesquad.airdnd.global.auth.jwt;

/**
 * 발급하는 JWT의 종류.
 *
 * <p>액세스/리프레시 토큰을 같은 서명 키로 발급하므로, 클레임({@code type})으로 둘을 구분한다.
 * 이렇게 하면 액세스 토큰을 리프레시 엔드포인트에 제출하거나 그 반대로 오용하는 것을 막을 수 있다.</p>
 */
public enum TokenType {
    ACCESS,
    REFRESH
}
