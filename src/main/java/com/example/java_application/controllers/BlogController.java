package com.example.java_application.controllers;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.example.java_application.models.Post;
import com.example.java_application.repo.PostRepository;
import com.example.java_application.services.ImageService;

import jakarta.servlet.http.HttpServletRequest;

@Controller
public class BlogController {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private ImageService imageService;

    @Value("${upload.path}")
    private String uploadPath;

	@GetMapping("/blog")
    public String blogMain(HttpServletRequest request, Model model) {
        Iterable<Post> posts = postRepository.findAll();
        model.addAttribute("posts", posts);
        model.addAttribute("currentUrl", request.getRequestURI());

        return "blog-main";
    }
    
 
    @GetMapping("/blog/success")
    public String blogSuccessPage(@RequestParam(required = false) String type, Model model) {
        String message = "";
        if ("add".equals(type)) {
            message = "Post is added successfully!";
        } else if ("edit".equals(type)) {
            message = "Post is saved successfully!";
        }
        else if ("remove".equals(type)) {
            message = "Post is removed successfully";
        }
        model.addAttribute("message", message);
        return "blog-success";
    }
    
	@GetMapping("/blog/add")
    public String blogAdd(HttpServletRequest request, Model model) {
        model.addAttribute("currentUrl", request.getRequestURI());
        return "blog-add";
    }
    
	@PostMapping("/blog/add")
    public String blogPostAdd(@RequestParam String title, @RequestParam String anons, @RequestParam String content,
    @RequestParam("coverImage") MultipartFile coverImage,
            Model model, RedirectAttributes redirectAttributes) throws IOException {
        Post post = new Post(title, anons, content);
        post.setCreatedAt(LocalDateTime.now());

        if (coverImage != null && !coverImage.isEmpty()) {
            String resultFilename = imageService.saveImageToStorage(uploadPath, coverImage);
            post.setCoverImagePath(resultFilename);
        }

        postRepository.save(post);

        redirectAttributes.addAttribute("type", "add");

        return "redirect:/blog/success";
    }

    @GetMapping("/blog/{id}")
    public String blogDetails(@PathVariable(value = "id") long id, Model model) {

        Optional<Post> post = postRepository.findById(id);

        if (post.isPresent()) {
            model.addAttribute("post", post.get());
            return "blog-details";
        } else {
            return "redirect:/blog";
        }
    }

    @GetMapping("/blog/{id}/edit")
    public String blogEdit(@PathVariable(value = "id") long id, Model model) {

        Optional<Post> post = postRepository.findById(id);

        if (post.isPresent()) {
            model.addAttribute("post", post.get());
            return "blog-edit";
        } else {
            return "redirect:/blog";
        }
    }
    
    @PostMapping("/blog/{id}/edit")
    public String blogEditSave(@PathVariable(value = "id") long id, @RequestParam String title,
            @RequestParam String anons, @RequestParam String content,
    @RequestParam("coverImage") MultipartFile coverImage,
            Model model, RedirectAttributes redirectAttributes) throws IOException {

        Post post = postRepository.findById(id).orElseThrow();

        post.setTitle(title);
        post.setAnons(anons);
        post.setContent(content);

        String oldCoverImagePath = post.getCoverImagePath();
    
        if (coverImage != null && !coverImage.isEmpty()) {
            // Если есть новое изображение, удаляем старое и добавляем новое
            if (oldCoverImagePath != null && !oldCoverImagePath.isEmpty()) {
                imageService.deleteImage(uploadPath, oldCoverImagePath);
            }
            String newCoverImagePath = imageService.saveImageToStorage(uploadPath, coverImage);
            post.setCoverImagePath(newCoverImagePath);
        } else {
            // Если изображение не поступает, удаляем существующее изображение и очищаем путь
            if (oldCoverImagePath != null && !oldCoverImagePath.isEmpty()) {
                imageService.deleteImage(uploadPath, oldCoverImagePath);
            }
            post.setCoverImagePath(null);
        }

        postRepository.save(post);
        redirectAttributes.addAttribute("type", "edit");
        return "redirect:/blog/success";
    }

    @PostMapping("/blog/{id}/remove")
    public String blogDelete(@PathVariable(value = "id") long id,
            Model model, RedirectAttributes redirectAttributes) throws IOException {
        Post post = postRepository.findById(id).orElseThrow();

        if (post.getCoverImagePath() != null) {
            imageService.deleteImage(uploadPath, post.getCoverImagePath());
        }

        redirectAttributes.addAttribute("type", "remove");

        postRepository.delete(post);
        return "redirect:/blog/success";
    }
}