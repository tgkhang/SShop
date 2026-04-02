package com.xxxx.ddd.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * RedisConfig configures the RedisTemplate bean used throughout the application.
 *
 * By default, Spring's RedisTemplate uses Java serialization for both keys and values,
 * which produces unreadable binary data in Redis. This configuration overrides that
 * behavior to use human-readable serializers:
 *
 *   - Keys   → StringRedisSerializer  : stored as plain UTF-8 strings (e.g. "user:42")
 *   - Values → Jackson2JsonRedisSerializer : stored as JSON (e.g. {"id":42,"name":"Alice"})
 */
@Configuration
public class RedisConfig {

    /**
     * Creates and configures a RedisTemplate with JSON value serialization.
     *
     * @param connectionFactory auto-wired by Spring Boot from application.yml
     *                          (spring.data.redis.*) — no manual setup needed.
     * @return a fully initialized RedisTemplate ready for use via @Autowired
     *
     * @SuppressWarnings: Jackson2JsonRedisSerializer uses a raw type in Spring Data
     * Redis 2.x; the warning is cosmetic and does not affect runtime behavior.
     */
    @Bean
    @SuppressWarnings(value = { "unchecked", "rawtypes" })
    public RedisTemplate<Object, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<Object, Object> redisTemplate = new RedisTemplate<>();

        // Bind this template to the connection pool managed by Spring Boot.
        redisTemplate.setConnectionFactory(connectionFactory);

        // Jackson2JsonRedisSerializer converts Java objects ↔ JSON bytes.
        // Passing Object.class makes it generic enough to handle any POJO.
        Jackson2JsonRedisSerializer serializer = new Jackson2JsonRedisSerializer(Object.class);

        // --- Simple key/value serializers ---

        // Keys are stored as plain strings (e.g. "product:sku:1001").
        // Using StringRedisSerializer here ensures keys are human-readable in Redis.
        redisTemplate.setKeySerializer(new StringRedisSerializer());

        // Values are stored as JSON, so any POJO can be cached and retrieved safely.
        redisTemplate.setValueSerializer(serializer);

        // --- Hash key/value serializers (used with opsForHash()) ---

        // Hash field names are also stored as plain strings for readability.
        redisTemplate.setHashKeySerializer(new StringRedisSerializer());

        // Hash field values follow the same JSON serialization as top-level values.
        redisTemplate.setHashValueSerializer(serializer);

        // Validate that all required properties are set before the bean is used.
        redisTemplate.afterPropertiesSet();
        return redisTemplate;
    }
}

// ---------------------------------------------------------------------------
// Spring Boot 3.x / Spring Data Redis 3.x alternative (kept for reference)
// ---------------------------------------------------------------------------
// GenericJacksonJsonRedisSerializer is the newer, type-safe replacement for
// Jackson2JsonRedisSerializer. It embeds the class name in the JSON payload so
// that deserialization can recreate the exact original type without requiring
// the caller to specify a target class. Use this when upgrading to Spring Boot 4.
//
// package com.xxxx.ddd.infrastructure.config;
//
// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import org.springframework.data.redis.connection.RedisConnectionFactory;
// import org.springframework.data.redis.core.RedisTemplate;
// import
// org.springframework.data.redis.serializer.GenericJacksonJsonRedisSerializer;
// import org.springframework.data.redis.serializer.StringRedisSerializer;
//
// @Configuration
// public class RedisConfig {
//     @Bean
//     public RedisTemplate<Object, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
//         RedisTemplate<Object, Object> redisTemplate = new RedisTemplate<>();
//         redisTemplate.setConnectionFactory(connectionFactory);
//
//         // builder() API is only available in Spring Data Redis 3.x+
//         GenericJacksonJsonRedisSerializer serializer =
//             GenericJacksonJsonRedisSerializer.builder().build();
//
//         redisTemplate.setKeySerializer(new StringRedisSerializer());
//         redisTemplate.setValueSerializer(serializer);
//
//         redisTemplate.setHashKeySerializer(new StringRedisSerializer());
//         redisTemplate.setHashValueSerializer(serializer);
//
//         redisTemplate.afterPropertiesSet();
//         return redisTemplate;
//     }
// }
