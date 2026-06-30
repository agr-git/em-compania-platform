"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/features/auth/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState | null, FormData>(login, null);

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700 dark:text-neutral-300">Correo</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="vendedor@emcompania.test"
          className="rounded-md border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-100"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700 dark:text-neutral-300">Contraseña</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-md border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-100"
        />
      </label>

      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand-primary px-4 py-2 font-medium text-brand-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
