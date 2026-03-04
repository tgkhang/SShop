package com.xxxx.ddd.application.service.event.impl;

import com.xxxx.ddd.application.service.event.EventAppService;
import org.springframework.stereotype.Service;

@Service
public class EventAppServiceImpl implements EventAppService {
    @Override
    public String status() {
        return "Application is running";
    }
}
