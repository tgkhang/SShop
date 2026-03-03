package com.xxxx.controller.resource;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/status")
public class FirstController {
    @RequestMapping
    public String getStatus() {
        return "Application is running";
    }
}
