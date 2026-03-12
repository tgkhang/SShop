package com.xxxx.ddd.application.service.event.impl;

import com.xxxx.ddd.application.service.event.EventAppService;
import com.xxxx.ddd.domain.service.FirstDomainService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class EventAppServiceImpl implements EventAppService {
    //call Domain servce
    @Autowired
    private FirstDomainService firstDomainService;

    @Override
    public String sayHi(String name) {
        return firstDomainService.sayHi(name);
    }
}
