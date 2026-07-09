"use client";

import * as React from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@rocky/ui/components/alert";
import { Button } from "@rocky/ui/components/button";
import { Form } from "@rocky/ui/components/form";

export interface ValidatedFormProps<TValues extends FieldValues> {
  form: UseFormReturn<TValues>;
  onValid: (values: TValues) => void | Promise<void>;
  children: React.ReactNode;
  submitText?: string;
  submitting?: boolean;
}

export function ValidatedForm<TValues extends FieldValues>({
  form,
  onValid,
  children,
  submitText = "Save",
  submitting = false,
}: ValidatedFormProps<TValues>) {
  const showError = form.formState.isSubmitted && !form.formState.isValid;
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onValid)} className="flex flex-col gap-4">
        {children}
        {showError ? (
          <Alert variant="destructive">
            <AlertTitle>Check the form</AlertTitle>
            <AlertDescription>Some fields need your attention before saving.</AlertDescription>
          </Alert>
        ) : null}
        <Button type="submit" disabled={submitting} className="self-start">
          {submitting ? "Saving…" : submitText}
        </Button>
      </form>
    </Form>
  );
}
