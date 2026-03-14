package com.xxxx.controller.resource;

import com.xxxx.ddd.application.service.event.EventAppService;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.security.SecureRandom;

@RestController
@RequestMapping("/status")
public class FirstController {

    @Autowired
    private EventAppService eventAppService;

    private RestTemplate restTemplate = new RestTemplate();

    @GetMapping("/abc")
    @RateLimiter(name = "backendA",fallbackMethod = "fallbackHello")
    public String getStatus() {
//        return "Application is running";
        return eventAppService.sayHi("xxxx");
    }


    public String fallbackHello(Throwable t) {
        return "Fallback response: " + t.getMessage();
    }

    private static final SecureRandom secureRandom = new SecureRandom();

    @GetMapping("/circuit-breaker")
    @CircuitBreaker(name = "checkRandom", fallbackMethod = "fallbackCircuitBreaker")
    public String circuitBreaker() {
        int id = secureRandom.nextInt(20)+1;
        String url = "https://fakestoreapi.com/products/" + id;

        return restTemplate.getForObject(url, String.class);
    }

    public String fallbackCircuitBreaker(Throwable t) {
        return "Fallback response: " + t.getMessage();
    }
}
