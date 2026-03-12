package com.xxxx.ddd.infrastructure.persistence.repository;

import com.xxxx.ddd.domain.repository.FirstDomainRepository;
import org.springframework.stereotype.Service;

@Service
public class FirstInfrasRepositoryImpl implements FirstDomainRepository {
    @Override
    public String sayHi(String name) {
        return "Hi Infrastructure, " + name;
    }
}
