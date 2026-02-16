# Gestión de Usuarios y Roles

## Roles Disponibles

El sistema ahora cuenta con 3 roles:

### 1. Admin (Administrador)
- Acceso completo al sistema
- Puede crear, editar y eliminar usuarios de cualquier rol
- Puede gestionar todos los aspectos de la tienda

### 2. Gerente
- Acceso casi completo al sistema
- Puede crear y gestionar empleados
- **NO puede** crear otros gerentes o administradores
- **NO puede** eliminar usuarios
- Puede gestionar productos, ventas, clientes, reportes, etc.

### 3. Empleado
- Acceso básico para operaciones diarias
- Puede realizar ventas
- Puede consultar productos y clientes
- No puede acceder a configuraciones avanzadas

## Migración de Base de Datos

Para agregar el rol "gerente" a tu base de datos existente:

```bash
npm run db:migrate:gerente
```

Este comando:
1. Actualiza la tabla de usuarios para permitir el rol "gerente"
2. Mantiene todos los usuarios existentes
3. No afecta los datos actuales

## API Endpoints

### Listar Usuarios
```
GET /api/users
Headers: Authorization: Bearer {token}
Requiere: Admin o Gerente
```

### Crear Usuario
```
POST /api/users
Headers: Authorization: Bearer {token}
Body: {
  "username": "usuario123",
  "password": "contraseña",
  "fullName": "Nombre Completo",
  "role": "empleado" | "gerente" | "admin"
}

Reglas:
- Admin puede crear cualquier rol
- Gerente solo puede crear empleados
```

### Actualizar Usuario
```
PATCH /api/users/:id
Headers: Authorization: Bearer {token}
Body: {
  "fullName": "Nuevo Nombre",
  "active": true | false,
  "password": "nueva_contraseña" (opcional)
}

Reglas:
- Admin puede actualizar cualquier usuario
- Gerente solo puede actualizar empleados
```

### Eliminar Usuario
```
DELETE /api/users/:id
Headers: Authorization: Bearer {token}
Requiere: Solo Admin
```

## Ejemplos de Uso

### Crear un Gerente (como Admin)
```javascript
const response = await fetch('http://localhost:3000/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    username: 'gerente1',
    password: 'password123',
    fullName: 'Juan Pérez',
    role: 'gerente'
  })
});
```

### Crear un Empleado (como Gerente o Admin)
```javascript
const response = await fetch('http://localhost:3000/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    username: 'empleado1',
    password: 'password123',
    fullName: 'María García',
    role: 'empleado'
  })
});
```

### Listar Todos los Usuarios
```javascript
const response = await fetch('http://localhost:3000/api/users', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const users = await response.json();
```

## Seguridad

- Las contraseñas se almacenan con hash bcrypt
- Los gerentes no pueden escalar privilegios
- Los usuarios no pueden eliminarse a sí mismos
- Todas las operaciones requieren autenticación JWT

## Próximos Pasos

Para agregar una interfaz de usuario para gestión de usuarios, necesitarás:

1. Crear una sección en el panel de admin
2. Agregar formularios para crear/editar usuarios
3. Mostrar la lista de usuarios con opciones de edición
4. Implementar validaciones en el frontend

¿Necesitas ayuda con la interfaz de usuario?
