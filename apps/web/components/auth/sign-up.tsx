"use client";

import { useAuth, useSignUpEmail } from "@better-auth-ui/react";
import { Button } from "@rocky/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@rocky/ui/components/card";
import { Input } from "@rocky/ui/components/input";
import { Label } from "@rocky/ui/components/label";
import Link from "next/link";
import { type SyntheticEvent, useState } from "react";

export function SignUp() {
  const { authClient, basePaths, localization, redirectTo, viewPaths, navigate } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const { mutate: signUpEmail, isPending } = useSignUpEmail(authClient, {
    onError: (err) => {
      setError(err.error?.message ?? err.message);
      setPassword("");
      setConfirmPassword("");
    },
    onSuccess: () => {
      navigate({ to: redirectTo });
    },
  });

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(localization.auth.passwordsDoNotMatch);
      return;
    }

    signUpEmail({ name, email, password });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{localization.auth.signUp}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">{localization.auth.name}</Label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder={localization.auth.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{localization.auth.email}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={localization.auth.emailPlaceholder}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              required
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{localization.auth.password}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder={localization.auth.passwordPlaceholder}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              required
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">{localization.auth.confirmPassword}</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder={localization.auth.confirmPasswordPlaceholder}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              required
              disabled={isPending}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "..." : localization.auth.signUp}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {localization.auth.alreadyHaveAnAccount}{" "}
          <Link href={`${basePaths.auth}/${viewPaths.auth.signIn}`} className="underline underline-offset-4">
            {localization.auth.signIn}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
