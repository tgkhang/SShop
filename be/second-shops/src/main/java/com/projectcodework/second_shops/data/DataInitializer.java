package com.projectcodework.second_shops.data;

import com.projectcodework.second_shops.model.User;
import com.projectcodework.second_shops.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationListener<ApplicationReadyEvent> {
    private final UserRepository userRepository;

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        createDefaultUserIfNotExist();
    }

    public void createDefaultUserIfNotExist() {
        for(int i=1;i<=5;++i){
            String defaultEmail= "user"+i+"@gmail.com";
            if(userRepository.existsByEmail(defaultEmail)){
                continue;
            }

            User user = new User();
            user.setFirstName("The user name");
            user.setLastName("The user last name");
            user.setEmail(defaultEmail);
            user.setPassword("123456");
            userRepository.save(user);
            System.out.println("Default user" +i+ "created successfully");
        }
    }
}
