# Gestión Financiera

Sistema de gestión de ventas, préstamos y cobranzas pensado para pequeños comercios, prestamistas y cooperativas.

## Qué hace

- **Clientes** — alta y seguimiento de clientes.
- **Préstamos** — carga de préstamos con plan de pagos (`payment_schedule`).
- **Cobranzas** — registro de pagos contra ese plan.
- **Ventas** — módulo de ventas independiente del flujo de préstamos.
- **Dashboard** — vista consolidada de la operación.
- **Auth** — login con roles (`profiles` + `user_roles`).

## Stack

React 18 + TypeScript + Vite, shadcn/ui sobre Radix, Tailwind, React Router, React Query, React Hook Form + Zod, Supabase (Postgres + Auth) como backend.

## Estado actual

Prototipo funcional armado sobre Supabase, con el esquema de base ya modelado (`profiles`, `user_roles`, `customers`, `loans`, `payments`, `payment_schedule`). **La instancia de Supabase original no está conectada** — para levantarlo hay que crear un proyecto nuevo, correr las migraciones de `supabase/migrations/` y completar `.env` a partir de `.env.example`.

## Desarrollo local

```sh
npm install
cp .env.example .env   # completar con las credenciales del proyecto Supabase
npm run dev
```
