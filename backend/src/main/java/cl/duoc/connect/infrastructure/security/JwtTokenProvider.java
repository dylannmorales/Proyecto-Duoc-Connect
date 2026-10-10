package cl.duoc.connect.infrastructure.security;

import cl.duoc.connect.infrastructure.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtTokenProvider {

    private static final String CLAIM_TYPE = "type";
    private static final String CLAIM_USER_ID = "userId";
    private static final String TYPE_ACCESS = "access";
    private static final String TYPE_REFRESH = "refresh";

    private final SecretKey secretKey;
    private final long accessExpirationMs;
    private final long refreshExpirationMs;

    public JwtTokenProvider(JwtProperties jwtProperties) {
        this.secretKey = buildKey(jwtProperties.getSecret());
        this.accessExpirationMs = jwtProperties.getAccessExpirationMs();
        this.refreshExpirationMs = jwtProperties.getRefreshExpirationMs();
    }

    public String generateAccessToken(UUID userId, String email) {
        return buildToken(userId, email, TYPE_ACCESS, accessExpirationMs);
    }

    public String generateRefreshToken(UUID userId, String email) {
        return buildToken(userId, email, TYPE_REFRESH, refreshExpirationMs);
    }

    public boolean isAccessToken(String token) {
        return TYPE_ACCESS.equals(extractClaim(token, CLAIM_TYPE, String.class));
    }

    public boolean isRefreshToken(String token) {
        return TYPE_REFRESH.equals(extractClaim(token, CLAIM_TYPE, String.class));
    }

    public UUID extractUserId(String token) {
        String userId = extractClaim(token, CLAIM_USER_ID, String.class);
        return UUID.fromString(userId);
    }

    public String extractEmail(String token) {
        return extractClaim(token, Claims.SUBJECT, String.class);
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    private String buildToken(UUID userId, String email, String type, long expirationMs) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(email)
                .claim(CLAIM_USER_ID, userId.toString())
                .claim(CLAIM_TYPE, type)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey)
                .compact();
    }

    private <T> T extractClaim(String token, String claimName, Class<T> type) {
        Claims claims = Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.get(claimName, type);
    }

    private SecretKey buildKey(String secret) {
        try {
            byte[] keyBytes = Decoders.BASE64.decode(secret);
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (RuntimeException ex) {
            byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
            if (keyBytes.length < 32) {
                throw new IllegalArgumentException("JWT secret debe tener al menos 32 caracteres");
            }
            return Keys.hmacShaKeyFor(keyBytes);
        }
    }
}
