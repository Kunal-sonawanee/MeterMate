package com.metermate.controller;

import com.metermate.dto.ReadingRequest;
import com.metermate.dto.ReadingResponse;
import com.metermate.service.ReadingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/readings")
public class ReadingController {

    private final ReadingService readingService;

    public ReadingController(ReadingService readingService) {
        this.readingService = readingService;
    }

    @PostMapping
    public ResponseEntity<ReadingResponse> save(@Valid @RequestBody ReadingRequest request) {
        return ResponseEntity.ok(readingService.saveMonthlyReading(request));
    }

    @GetMapping
    public ResponseEntity<List<ReadingResponse>> all() {
        return ResponseEntity.ok(readingService.getAllReadings());
    }

    @GetMapping("/history")
    public ResponseEntity<List<ReadingResponse>> history(@RequestParam(required = false) Long meterId) {
        if (meterId == null) {
            return all();
        }
        return ResponseEntity.ok(readingService.getReadingsByMeter(meterId));
    }
}
