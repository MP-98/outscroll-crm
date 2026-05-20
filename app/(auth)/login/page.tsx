import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · Outscroll CRM" };

export default function LoginPage() {
  return (
    <div className="h-full overflow-y-auto flex items-center justify-center px-6 py-12 bg-muted/30">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <div className="mx-auto h-9 w-9 rounded-md bg-primary text-primary-foreground grid place-items-center font-semibold">
            O
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Outscroll CRM</h1>
          <p className="text-sm text-muted-foreground">Sign in with your work email and password.</p>
        </div>
        <Suspense fallback={<div className="h-40" />}>
          <LoginForm />
        </Suspense>
        <p className="text-[11px] text-muted-foreground text-center">
          Access by invite only. Contact an admin if you don&apos;t have credentials yet.
        </p>
      </div>
    </div>
  );
}
