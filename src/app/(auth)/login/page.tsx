import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-8 px-6">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-widest text-neutral-500">
          E.M. Compañía S.A.S
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
          Cotización y Pedidos
        </h1>
        <p className="text-sm text-neutral-500">Acceso interno. Inicia sesión para continuar.</p>
      </div>

      <LoginForm />

      <p className="text-xs text-neutral-400">
        Demo: vendedor@emcompania.test · contraseña <code>Demo1234!</code>
      </p>
    </main>
  );
}
