# Requirements Document: Cierre de Caja Diario

## Introduction

El Cierre de Caja Diario es una funcionalidad crítica para tiendas de barrio colombianas que permite a los dueños y empleados reconciliar el efectivo al final de cada día. Este sistema ayuda a detectar faltantes, sobrantes, y mantener un control preciso del flujo de efectivo, reduciendo pérdidas y robos.

El sistema debe integrarse con las ventas existentes, distinguir entre pagos en efectivo y fiado, y generar reportes detallados de cada cierre para auditoría y análisis histórico.

## Glossary

- **Sistema**: InvenStore - Sistema de gestión de inventario
- **Caja**: Registro de efectivo de la tienda
- **Cierre**: Proceso de reconciliación de efectivo al final del día
- **Efectivo_Esperado**: Suma de todas las ventas en efectivo del día
- **Efectivo_Real**: Cantidad física de efectivo contada por el usuario
- **Diferencia**: Efectivo_Real menos Efectivo_Esperado
- **Faltante**: Diferencia negativa (hay menos efectivo del esperado)
- **Sobrante**: Diferencia positiva (hay más efectivo del esperado)
- **Fiado**: Ventas a crédito registradas en el sistema
- **Usuario**: Persona autenticada que realiza el cierre
- **Tienda**: Tenant en el sistema multi-tenant (identificado por store_id)

## Requirements

### Requirement 1: Crear Cierre de Caja

**User Story:** Como dueño de tienda, quiero crear un cierre de caja diario, para reconciliar el efectivo y detectar faltantes o sobrantes.

#### Acceptance Criteria

1. WHEN un usuario autenticado solicita crear un cierre de caja, THE Sistema SHALL calcular el efectivo esperado sumando todas las ventas en efectivo del día actual para su tienda
2. WHEN se calcula el efectivo esperado, THE Sistema SHALL incluir solo ventas con payment_type 'efectivo' o la porción cash_amount de ventas 'mixto'
3. WHEN un usuario ingresa el efectivo real contado, THE Sistema SHALL calcular la diferencia (efectivo_real - efectivo_esperado)
4. WHEN se crea un cierre de caja, THE Sistema SHALL registrar user_id, store_id, fecha, efectivo_esperado, efectivo_real, diferencia, y notas opcionales
5. WHEN se crea un cierre de caja, THE Sistema SHALL persistir el registro en la tabla cash_register_closings
6. IF ya existe un cierre para la tienda en la fecha actual, THEN THE Sistema SHALL prevenir la creación de un segundo cierre y retornar un error descriptivo

### Requirement 2: Calcular Totales del Día

**User Story:** Como dueño de tienda, quiero ver un resumen completo de las transacciones del día, para entender el flujo de dinero antes de cerrar la caja.

#### Acceptance Criteria

1. WHEN un usuario solicita los totales del día, THE Sistema SHALL calcular el total de ventas en efectivo del día actual para su tienda
2. WHEN se calculan los totales, THE Sistema SHALL calcular el total de ventas a crédito (fiado) del día actual
3. WHEN se calculan los totales, THE Sistema SHALL calcular el número total de transacciones del día
4. WHEN se calculan los totales, THE Sistema SHALL filtrar por store_id del usuario autenticado
5. WHEN se calculan los totales, THE Sistema SHALL considerar solo ventas con status 'completed'
6. WHEN se calculan los totales, THE Sistema SHALL usar la fecha actual del servidor para determinar "día actual"

### Requirement 3: Consultar Historial de Cierres

**User Story:** Como dueño de tienda, quiero ver el historial de cierres de caja, para auditar y analizar patrones de faltantes o sobrantes.

#### Acceptance Criteria

1. WHEN un usuario solicita el historial de cierres, THE Sistema SHALL retornar todos los cierres de su tienda ordenados por fecha descendente
2. WHEN se retorna el historial, THE Sistema SHALL incluir para cada cierre: fecha, usuario que realizó el cierre, efectivo esperado, efectivo real, diferencia, y notas
3. WHEN se retorna el historial, THE Sistema SHALL incluir el nombre completo del usuario que realizó cada cierre
4. WHERE el usuario solicita filtrar por rango de fechas, THE Sistema SHALL retornar solo cierres dentro del rango especificado
5. WHERE el usuario solicita paginación, THE Sistema SHALL retornar resultados paginados con límite y offset configurables

### Requirement 4: Exportar Reporte de Cierre

**User Story:** Como dueño de tienda, quiero exportar el reporte de cierre de caja, para imprimirlo o guardarlo como respaldo físico.

#### Acceptance Criteria

1. WHEN un usuario solicita exportar un cierre específico, THE Sistema SHALL generar un reporte en formato JSON con todos los detalles del cierre
2. WHEN se genera el reporte, THE Sistema SHALL incluir información de la tienda (nombre, dirección, teléfono)
3. WHEN se genera el reporte, THE Sistema SHALL incluir desglose de ventas del día (efectivo, fiado, total de transacciones)
4. WHEN se genera el reporte, THE Sistema SHALL incluir información del cierre (efectivo esperado, real, diferencia)
5. WHEN se genera el reporte, THE Sistema SHALL incluir información del usuario que realizó el cierre
6. WHEN se genera el reporte, THE Sistema SHALL incluir timestamp de generación del reporte

### Requirement 5: Validación y Seguridad

**User Story:** Como administrador del sistema, quiero que los cierres de caja estén protegidos y validados, para prevenir manipulación y errores.

#### Acceptance Criteria

1. WHEN un usuario intenta crear o consultar cierres, THE Sistema SHALL validar que el usuario esté autenticado con JWT válido
2. WHEN se crea un cierre, THE Sistema SHALL validar que efectivo_real sea un número positivo o cero
3. WHEN se crea un cierre, THE Sistema SHALL validar que las notas no excedan 500 caracteres
4. WHEN se consultan cierres, THE Sistema SHALL filtrar automáticamente por store_id del usuario autenticado
5. WHEN se intenta acceder a un cierre de otra tienda, THE Sistema SHALL retornar error 403 Forbidden
6. WHEN ocurre un error de base de datos, THE Sistema SHALL retornar un mensaje de error descriptivo sin exponer detalles internos

### Requirement 6: Interfaz de Usuario para Cierre

**User Story:** Como empleado de tienda, quiero una interfaz clara para realizar el cierre de caja, para completar el proceso rápidamente sin errores.

#### Acceptance Criteria

1. WHEN un usuario accede a la sección de cierre de caja, THE Sistema SHALL mostrar un botón "Cerrar Caja" claramente visible
2. WHEN el usuario hace clic en "Cerrar Caja", THE Sistema SHALL mostrar un modal con el resumen del día
3. WHEN se muestra el modal, THE Sistema SHALL mostrar efectivo esperado, total de ventas a crédito, y número de transacciones
4. WHEN el usuario ingresa el efectivo real, THE Sistema SHALL calcular y mostrar la diferencia en tiempo real
5. WHEN la diferencia es negativa, THE Sistema SHALL mostrar el valor en color rojo con etiqueta "Faltante"
6. WHEN la diferencia es positiva, THE Sistema SHALL mostrar el valor en color verde con etiqueta "Sobrante"
7. WHEN la diferencia es cero, THE Sistema SHALL mostrar "Cuadrado" en color azul
8. WHEN el usuario completa el cierre, THE Sistema SHALL mostrar mensaje de confirmación y cerrar el modal

### Requirement 7: Interfaz de Historial de Cierres

**User Story:** Como dueño de tienda, quiero ver el historial de cierres en una tabla clara, para revisar rápidamente los cierres anteriores.

#### Acceptance Criteria

1. WHEN un usuario accede al historial de cierres, THE Sistema SHALL mostrar una tabla con columnas: Fecha, Usuario, Efectivo Esperado, Efectivo Real, Diferencia, Notas
2. WHEN se muestra la tabla, THE Sistema SHALL formatear los valores monetarios usando formato colombiano (toLocaleString('es-CO'))
3. WHEN se muestra la diferencia, THE Sistema SHALL aplicar color según el tipo (rojo para faltante, verde para sobrante, azul para cuadrado)
4. WHEN el usuario hace clic en una fila, THE Sistema SHALL mostrar un modal con detalles completos del cierre
5. WHEN se muestra el modal de detalles, THE Sistema SHALL incluir un botón "Exportar" para descargar el reporte
6. WHEN no hay cierres registrados, THE Sistema SHALL mostrar mensaje "No hay cierres registrados"

### Requirement 8: Persistencia de Datos

**User Story:** Como administrador del sistema, quiero que los cierres de caja se almacenen correctamente en la base de datos, para garantizar integridad y trazabilidad.

#### Acceptance Criteria

1. THE Sistema SHALL crear una tabla cash_register_closings con campos: id, store_id, user_id, closing_date, expected_cash, actual_cash, difference, notes, created_at
2. WHEN se crea la tabla, THE Sistema SHALL establecer foreign keys a stores(id) y users(id) con ON DELETE CASCADE
3. WHEN se crea la tabla, THE Sistema SHALL crear índice en (store_id, closing_date) para optimizar consultas
4. WHEN se crea la tabla, THE Sistema SHALL establecer restricción UNIQUE en (store_id, closing_date) para prevenir cierres duplicados
5. WHEN se inserta un cierre, THE Sistema SHALL usar transacciones para garantizar atomicidad
