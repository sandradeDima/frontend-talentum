# Frontend (Next.js + Tailwind)

## Purpose

Interfaz web para:
- autenticación global y por empresa (`slug`)
- aceptación de invitaciones
- administración de empresas (crear/listar/editar)

Todo texto de UI está en español, manteniendo código y nombres técnicos en inglés.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS

## Folder structure

```text
app/
  login/
  [companySlug]/login/
  invite/accept/
  admin/companies/
components/
  admin/
lib/
services/
types/
```

## Routes

- `/login`
- `/:companySlug/login`
- `/invite/accept?token=...`
- `/admin/companies`
- `/admin/companies/new`
- `/admin/companies/[id]`
- `/admin/companies/[id]/surveys` (placeholder)

## Environment variables

Archivo: `.env.example`

- `NEXT_PUBLIC_APP_URL="http://localhost:3000"`
- `NEXT_PUBLIC_API_URL="http://localhost:4000/api"`

## Local development

1. `cp .env.example .env.local`
2. `npm install`
3. `npm run dev`

Producción local:
- `npm run build`
- `npm run start`

Lint:
- `npm run lint`

## Auth/session integration

- Se usa sesión por cookies `httpOnly` del backend (Better Auth).
- No se usa `localStorage` para tokens.
- Cliente HTTP (`fetch`) usa `credentials: "include"`.
- Server Components reenvían cookies al backend para `me` y rutas protegidas.

## Route protection

- `middleware.ts`: filtro temprano para `/admin/*` cuando no hay cookie de sesión.
- `app/admin/layout.tsx`: validación server-side de sesión/rol.

## Company login restriction behavior

- `/login`: acceso global.
- `/:companySlug/login`: primero valida existencia/contexto de empresa.
- Si el slug no existe, se bloquea envío de login.
- El backend rechaza usuarios de otra empresa aunque sus credenciales sean válidas.

## Invitation acceptance UX

- `/invite/accept` valida token al cargar.
- Estados soportados:
  - token faltante
  - token inválido
  - token expirado/revocado
  - token ya usado
  - token válido (muestra formulario)
- Al completar, se crea la cuenta `CLIENT_ADMIN` y la sesión queda iniciada.

## Manual QA checklist

- [ ] Login global con `ADMIN` funciona.
- [ ] Login por slug de empresa válida funciona para `CLIENT_ADMIN` correcto.
- [ ] Login por slug incorrecto rechaza acceso.
- [ ] Crear empresa desde `/admin/companies/new` muestra confirmación de invitación enviada.
- [ ] Empresa creada aparece en el listado con paginación/búsqueda.
- [ ] Click en fila abre `/admin/companies/[id]`.
- [ ] Edición de empresa guarda cambios y respeta restricciones por rol.
- [ ] `/admin/companies/[id]/surveys` muestra “Próximamente”.
- [ ] `/invite/accept?token=...` completa registro y redirige con sesión activa.

## Known limitations / next improvements

- Falta test e2e automático de flujos de auth/invitación.
- Falta módulo funcional de encuestas.
- Falta manejo de refresh tokens/cierre global de sesiones desde UI de seguridad.
