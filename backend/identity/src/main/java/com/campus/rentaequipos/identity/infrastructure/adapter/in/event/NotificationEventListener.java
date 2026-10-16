package com.campus.rentaequipos.identity.infrastructure.adapter.in.event;

import com.campus.rentaequipos.identity.application.usecase.NotificationUseCase;
import com.campus.rentaequipos.shared.domain.event.NotificationEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class NotificationEventListener {

    private final NotificationUseCase notificationUseCase;

    public NotificationEventListener(NotificationUseCase notificationUseCase) {
        this.notificationUseCase = notificationUseCase;
    }

    @EventListener
    public void onNotificationEvent(NotificationEvent event) {
        if (event.userId() == null) return;
        notificationUseCase.createNotification(
                event.userId(),
                event.title(),
                event.message(),
                event.type(),
                event.category(),
                event.link()
        );
    }
}
