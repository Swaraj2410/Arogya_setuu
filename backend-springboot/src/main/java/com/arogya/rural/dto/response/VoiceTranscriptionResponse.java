package com.arogya.rural.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VoiceTranscriptionResponse {

    private String text = "";
    private String language = "en";
}
