package com.campus.rentaequipos.infrastructure.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

@Controller
public class RootController {

    @GetMapping("/")
    public String rootRedirect(@RequestHeader(value = "referer", required = false) String referer) {
        if (referer != null && (referer.contains("5173") || referer.contains("/#/"))) {
            return "redirect:" + referer;
        }
        return "redirect:http://localhost:5173/#/client";
    }
}
