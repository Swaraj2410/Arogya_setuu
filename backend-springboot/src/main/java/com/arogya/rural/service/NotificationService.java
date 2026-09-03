package com.arogya.rural.service;

import com.arogya.rural.dto.response.NotificationResponse;
import com.arogya.rural.entity.Notification;
import com.arogya.rural.entity.User;
import com.arogya.rural.exception.ResourceNotFoundException;
import com.arogya.rural.mapper.ResponseMapper;
import com.arogya.rural.repository.NotificationRepository;
import com.arogya.rural.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final ResponseMapper responseMapper;

    @Transactional(readOnly = true)
    public List<NotificationResponse> listNotifications(UserPrincipal currentUser) {
        return notificationRepository.findByUserIdOrderByIdDesc(currentUser.getId())
                .stream()
                .map(responseMapper::toNotificationResponse)
                .toList();
    }

    @Transactional
    public NotificationResponse createForUser(User user, String title, String message, String type) {
        Notification notification = new Notification(user, title, message, type);
        return responseMapper.toNotificationResponse(notificationRepository.save(notification));
    }

    @Transactional
    public NotificationResponse markRead(UserPrincipal currentUser, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Not found"));
        if (!notification.getUser().getId().equals(currentUser.getId())) {
            throw new ResourceNotFoundException("Not found");
        }

        notification.setRead(true);
        return responseMapper.toNotificationResponse(notificationRepository.save(notification));
    }
}
