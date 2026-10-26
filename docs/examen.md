Implementar la lógica de negocio que permite a un Proveedor aceptar o rechazar las solicitudes de alquiler pendientes, cumpliendo con la funcionalidad clave del proyecto.



Descripción: Actualmente, las reservas pueden crearse, pero los proveedores no tienen un endpoint para gestionarlas (aprobarlas o rechazarlas). Este examen implementa esa lógica de estado.

Instrucciones:

Modificar Entidad Reserva:
Asegúrate de que la entidad Reserva tenga un campo para el estado (ej. EstadoReserva como un Enum) con valores: PENDIENTE, APROBADA, RECHAZADA.
El valor por defecto al crear una reserva debe ser PENDIENTE.
Lógica en ReservaService:
Implementa un método aprobarReserva(Long idReserva).
Debe buscar la reserva.
Verificar que el estado actual sea PENDIENTE.
Validar que la herramienta aún tenga disponibilidad. Si no hay disponibilidad, debe lanzar una excepción (ej. HerramientaNoDisponibleException).
Cambiar el estado a APROBADA.
Implementa un método rechazarReserva(Long idReserva).
Debe buscar la reserva.
Verificar que el estado actual sea PENDIENTE.
Cambiar el estado a RECHAZADA.
Controladores REST (Nuevos Endpoints):
POST /api/reservas/{id}/aprobar (Rol: Proveedor): Llama a reservaService.aprobarReserva(id).
POST /api/reservas/{id}/rechazar (Rol: Proveedor): Llama a reservaService.rechazarReserva(id).

Captura de Postman mostrando una llamada exitosa a .../aprobar y el JSON de respuesta.
Captura de la base de datos (DBeaver/pgAdmin) mostrando el estado de la reserva cambiado de PENDIENTE a APROBADA.
Captura de Postman mostrando una llamada exitosa a .../rechazar.
Commit en el repositorio de GitHub con el código funcional.