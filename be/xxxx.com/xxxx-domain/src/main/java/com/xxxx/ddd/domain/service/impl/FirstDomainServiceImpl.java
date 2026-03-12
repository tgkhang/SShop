package com.xxxx.ddd.domain.service.impl;

import com.xxxx.ddd.domain.repository.FirstDomainRepository;
import com.xxxx.ddd.domain.service.FirstDomainService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class FirstDomainServiceImpl implements FirstDomainService {
    @Autowired
    private FirstDomainRepository firstDomainRepository;

    @Override
    public String sayHi(String name) {
        return firstDomainRepository.sayHi(name);
    }
}
