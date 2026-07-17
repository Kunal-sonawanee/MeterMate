package com.metermate.controller;

import com.metermate.dto.SettingsRequest;
import com.metermate.dto.SettingsResponse;
import com.metermate.service.SettingsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final SettingsService settingsService;

    public SettingsController(SettingsService settingsService) {
        this.settingsService = settingsService;
    }

    @GetMapping
    public ResponseEntity<SettingsResponse> get() {
        return ResponseEntity.ok(settingsService.getSettings());
    }

    @PutMapping
    public ResponseEntity<SettingsResponse> update(@Valid @RequestBody SettingsRequest request) {
        return ResponseEntity.ok(settingsService.createOrUpdate(request));
    }
}
