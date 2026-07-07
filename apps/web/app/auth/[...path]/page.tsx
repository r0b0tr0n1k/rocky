// biome-ignore assist/source/organizeImports: OK
import { ForgotPassword, ResetPassword, SignIn, SignOut, SignUp } from "#components/auth/index";
import { viewPaths } from "@better-auth-ui/core";
import { notFound } from "next/navigation";

interface AuthPageProps {
  params: Promise<{ path: string[] }>;
}

const validPaths = Object.values(viewPaths.auth);

const componentByPath: Record<string, React.ComponentType> = {
  [viewPaths.auth.signIn]: SignIn,
  [viewPaths.auth.signUp]: SignUp,
  [viewPaths.auth.signOut]: SignOut,
  [viewPaths.auth.forgotPassword]: ForgotPassword,
  [viewPaths.auth.resetPassword]: ResetPassword,
};

export default async function AuthPage({ params }: AuthPageProps) {
  const { path } = await params;
  // path is a string[] from catch-all; join them
  const joined = path.join("/");

  if (!validPaths.includes(joined as (typeof validPaths)[number])) {
    notFound();
  }

  const Component = componentByPath[joined];
  if (!Component) notFound();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Component />
    </div>
  );
}
