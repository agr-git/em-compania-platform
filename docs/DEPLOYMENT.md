# Despliegue — Vercel

> Esta app es **full-stack dinámica** (Server Actions, RSC con RLS, `proxy.ts`, route
> handlers, Realtime). **No puede ir en GitHub Pages** (solo estático). El host es
> **Vercel**, que soporta todo Next.js de forma nativa y despliega desde `main`.

## Conectar el repo (una sola vez)

1. Entra a **[vercel.com/new](https://vercel.com/new)** e inicia sesión con GitHub.
2. **Import** del repo `agr-git/em-compania-platform`.
3. Vercel detecta Next.js + pnpm automáticamente. **No cambies** Build/Output (usa los
   defaults: build `pnpm build`).
4. Abre **Environment Variables** y agrega las de abajo (§Variables).
5. **Deploy**. En ~1–2 min queda una URL `https://<proyecto>.vercel.app`.

Desde ahí, **cada push a `main` despliega solo** (y cada PR genera un *Preview Deployment*).

## Variables de entorno (Production + Preview)

Copia los valores desde tu `.env.local` (no están en el repo). Marca el service role como
sensible; **nunca** lo expongas al cliente (no lleva prefijo `NEXT_PUBLIC_`).

| Variable | Ámbito | Valor |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | público | `https://skjwhfhicedslxhvwdkb.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | público | *(anon key de `.env.local`)* |
| `SUPABASE_SERVICE_ROLE_KEY` | **secreto** | *(service_role de `.env.local`)* |
| `WORLD_OFFICE_ADAPTER` | server | `mock` |
| `NOTIFICATION_ADAPTER` | server | `mock` |
| `NEXT_PUBLIC_APP_URL` | público | la URL de Vercel (opcional; tras el 1er deploy) |

> Concurso = adapters en `mock` (nada toca World Office real). El paso a producción real es
> cambiar `WORLD_OFFICE_ADAPTER=real` (ver `WORLD-OFFICE-INTEGRATION.md`), sin tocar código.

## Notas

- **Login (email/password)** funciona sin configurar redirect URLs en Supabase.
- **Supabase** ya tiene el esquema, RLS, seed y los 3 usuarios demo aplicados (proyecto
  `skjwhfhicedslxhvwdkb`).
- El repo es público, pero las env vars viven en Vercel, **no** en el repo.
- Si prefieres CI/CD desde GitHub Actions en vez de la integración nativa, se puede añadir un
  workflow que use `VERCEL_TOKEN`; hoy usamos la integración de Vercel (más simple).
