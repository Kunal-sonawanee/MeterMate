package com.metermate.service;

import com.metermate.dto.SettingsRequest;
import com.metermate.dto.SettingsResponse;

public interface SettingsService {

    SettingsResponse getSettings();

    SettingsResponse createOrUpdate(SettingsRequest request);
}
