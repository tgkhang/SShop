package com.xxxx.controller.resource;

import com.xxxx.ddd.application.service.event.EventAppService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/status")
public class FirstController {

    @Autowired
    private EventAppService eventAppService;

    @RequestMapping
    public String getStatus() {
//        return "Application is running";
        return eventAppService.sayHi("xxxx");
    }
}
