package com.campus.rentaequipos.shared.infrastructure.exception;

import com.campus.rentaequipos.shared.domain.exception.BusinessRuleViolationException;
import com.campus.rentaequipos.shared.domain.exception.DomainException;
import com.campus.rentaequipos.shared.domain.exception.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEntityNotFoundException(
            EntityNotFoundException ex,
            HttpServletRequest request
    ) {
        ErrorResponse errorResponse = new ErrorResponse(
                request.getRequestURI(),
                ex.getMessage(),
                HttpStatus.NOT_FOUND.value(),
                LocalDateTime.now()
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(BusinessRuleViolationException.class)
    public ResponseEntity<ErrorResponse> handleBusinessRuleViolationException(
            BusinessRuleViolationException ex,
            HttpServletRequest request
    ) {
        HttpStatus status = ex.getMessage().contains("Invalid credentials") ? HttpStatus.UNAUTHORIZED : HttpStatus.CONFLICT;
        ErrorResponse errorResponse = new ErrorResponse(
                request.getRequestURI(),
                ex.getMessage(),
                status.value(),
                LocalDateTime.now()
        );
        return new ResponseEntity<>(errorResponse, status);
    }

    @ExceptionHandler(DomainException.class)
    public ResponseEntity<ErrorResponse> handleDomainException(
            DomainException ex,
            HttpServletRequest request
    ) {
        ErrorResponse errorResponse = new ErrorResponse(
                request.getRequestURI(),
                ex.getMessage(),
                HttpStatus.BAD_REQUEST.value(),
                LocalDateTime.now()
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        String message = ex.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        ErrorResponse errorResponse = new ErrorResponse(
                request.getRequestURI(),
                message,
                HttpStatus.BAD_REQUEST.value(),
                LocalDateTime.now()
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentTypeMismatch(
            org.springframework.web.method.annotation.MethodArgumentTypeMismatchException ex,
            HttpServletRequest request
    ) {
        String message = String.format("El parámetro '%s' tiene un formato inválido. Se esperaba un valor de tipo '%s'.",
                ex.getName(), ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "desconocido");
        ErrorResponse errorResponse = new ErrorResponse(
                request.getRequestURI(),
                message,
                HttpStatus.BAD_REQUEST.value(),
                LocalDateTime.now()
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(
            IllegalArgumentException ex,
            HttpServletRequest request
    ) {
        ErrorResponse errorResponse = new ErrorResponse(
                request.getRequestURI(),
                ex.getMessage(),
                HttpStatus.BAD_REQUEST.value(),
                LocalDateTime.now()
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalStateException(
            IllegalStateException ex,
            HttpServletRequest request
    ) {
        // Transiciones de estado inválidas del dominio (ej. confirmar un alquiler que no está PENDING)
        ErrorResponse errorResponse = new ErrorResponse(
                request.getRequestURI(),
                ex.getMessage(),
                HttpStatus.CONFLICT.value(),
                LocalDateTime.now()
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex,
            HttpServletRequest request
    ) {
        String exName = ex.getClass().getName();
        if (exName.contains("AccessDeniedException") || exName.contains("AuthorizationDeniedException") || "Access Denied".equals(ex.getMessage())) {
            String msg = (ex.getMessage() != null && ex.getMessage().startsWith("Acceso denegado"))
                    ? ex.getMessage()
                    : "Acceso denegado: no tiene permisos para acceder a este recurso.";
            ErrorResponse errorResponse = new ErrorResponse(
                    request.getRequestURI(),
                    msg,
                    HttpStatus.FORBIDDEN.value(),
                    LocalDateTime.now()
            );
            return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
        }

        if (exName.contains("DataIntegrityViolationException") || exName.contains("ConstraintViolationException")) {
            String rootMsg = ex.getMessage() != null ? ex.getMessage().toLowerCase() : "";
            Throwable rootCause = ex.getCause();
            while (rootCause != null && rootCause.getCause() != null) {
                rootCause = rootCause.getCause();
            }
            if (rootCause != null && rootCause.getMessage() != null) {
                rootMsg += " " + rootCause.getMessage().toLowerCase();
            }

            String friendlyMsg = "La operación viola una regla de integridad de datos (registro duplicado o referencia inexistente).";
            if (rootMsg.contains("numeric field overflow") || rootMsg.contains("out of range") || rootMsg.contains("22003")) {
                friendlyMsg = "Uno de los montos o valores numéricos ingresados excede el límite máximo permitido por el sistema (máximo $9.999.999.999 COP).";
            } else if (rootMsg.contains("duplicate key") || rootMsg.contains("unique constraint") || rootMsg.contains("violates unique") || rootMsg.contains("23505")) {
                friendlyMsg = "Ya existe un registro con ese identificador, correo, nombre o número de serie único.";
            } else if (rootMsg.contains("foreign key") || rootMsg.contains("violates foreign key") || rootMsg.contains("23503")) {
                friendlyMsg = "La entidad referenciada (proveedor, categoría o usuario) no existe o no tiene un perfil comercial válido.";
            }

            ErrorResponse errorResponse = new ErrorResponse(
                    request.getRequestURI(),
                    friendlyMsg,
                    HttpStatus.CONFLICT.value(),
                    LocalDateTime.now()
            );
            return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
        }

        org.slf4j.LoggerFactory.getLogger(GlobalExceptionHandler.class)
                .error("Error no controlado en {}", request.getRequestURI(), ex);
        ErrorResponse errorResponse = new ErrorResponse(
                request.getRequestURI(),
                "Ocurrió un error inesperado en el servidor. Intente nuevamente.",
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                LocalDateTime.now()
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
