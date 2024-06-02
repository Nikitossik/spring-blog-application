package com.example.java_application.repo;

import org.springframework.data.repository.CrudRepository;

import com.example.java_application.models.Post;


public interface PostRepository extends CrudRepository<Post, Long> {
    
}
