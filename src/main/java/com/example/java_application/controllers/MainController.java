package com.example.java_application.controllers;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import jakarta.servlet.http.HttpServletRequest;

@Controller
public class MainController {

	@GetMapping("/")
	public String home(HttpServletRequest request, Model model) {
		model.addAttribute("currentUrl", request.getRequestURI());
		return "home";
	}

	@GetMapping("/about")
	public String about( Model model) {
		model.addAttribute("title", "About us");
		return "about";
	}


}