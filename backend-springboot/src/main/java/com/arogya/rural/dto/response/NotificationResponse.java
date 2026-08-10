package com.arogya.rural.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class NotificationResponse {

    private Long id;
    private Long userId;
    private String title;
    private String message;
    private String type;
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    private boolean read;

    @JsonProperty("isRead")
    public boolean isRead() {
        return read;
    }

    @JsonProperty("isRead")
    public void setRead(boolean read) {
        this.read = read;
    }
}
