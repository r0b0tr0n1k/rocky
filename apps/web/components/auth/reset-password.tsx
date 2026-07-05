"use client";

import { useAuth, useResetPassword } from "@better-auth-ui/react";
import { Button } from "@rocky/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@rocky/ui/components/card";
import { Input } from "@rocky/ui/components/input";
import { Label } from "@rocky/ui/components/label";
import Link from "next/link";
import { type SyntheticEvent, useEffect, useState } from "react";

export function ResetPassword() {
  const { authClient, basePaths, localization, viewPaths, navigate } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const { mutate: resetPassword, isPending } = useResetPassword(authClient, {
    onSuccess: () => {
      navigate({
        to: `${basePaths.auth}/${viewPaths.auth.signIn}`,
        replace: true,
      });
    },
    onError: (err) => {
      setError(err.error?.message ?? err.message);
    },
  });

  // Validate token exists on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get("token");
    if (!token) {
      navigate({
        to: `${basePaths.auth}/${viewPaths.auth.signIn}`,
        replace: true,
      });
    }
  }, [basePaths.auth, viewPaths.auth.signIn, navigate]);

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(localization.auth.passwordsDoNotMatch);
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get("token");
    if (!token) return;

    resetPassword({ token, newPassword: password });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{localization.auth.resetPassword}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{localization.auth.password}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder={localization.auth.newPasswordPlaceholder}
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
            {isPending ? "..." : localization.auth.resetPassword}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {localization.auth.rememberYourPassword}{" "}
          <Link href={`${basePaths.auth}/${viewPaths.auth.signIn}`} className="underline underline-offset-4">
            {localization.auth.signIn}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
