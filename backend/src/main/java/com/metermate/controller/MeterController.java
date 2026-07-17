package com.metermate.controller;

import com.metermate.dto.MeterRequest;
import com.metermate.dto.MeterResponse;
import com.metermate.service.MeterService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/meters")
public class MeterController {

    private final MeterService meterService;

    public MeterController(MeterService meterService) {
        this.meterService = meterService;
    }

    @GetMapping
    public ResponseEntity<List<MeterResponse>> getAll() {
        return ResponseEntity.ok(meterService.getAllMeters());
    }

    @GetMapping("/tenant")
    public ResponseEntity<List<MeterResponse>> getTenantMeters() {
        return ResponseEntity.ok(meterService.getTenantMeters());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MeterResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(meterService.getMeter(id));
    }

    @PostMapping
    public ResponseEntity<MeterResponse> create(@Valid @RequestBody MeterRequest request) {
        MeterResponse resp = meterService.createMeter(request);
        return ResponseEntity.created(URI.create("/api/meters/" + resp.id())).body(resp);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MeterResponse> update(@PathVariable Long id, @Valid @RequestBody MeterRequest request) {
        return ResponseEntity.ok(meterService.updateMeter(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        meterService.deleteMeter(id);
        return ResponseEntity.noContent().build();
    }
}
