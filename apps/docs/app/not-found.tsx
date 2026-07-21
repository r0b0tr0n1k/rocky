import Link from "next/link";
import { NotFoundPage } from "nextra-theme-docs";

export default function NotFound() {
  return (
    <NotFoundPage content="Report a broken link" labels="broken-link">
      <h1>404 — Page not found</h1>
      <p>The page you are looking for does not exist or has been moved.</p>
      <p>
        <Link href="/">← Back to home</Link>
      </p>
    </NotFoundPage>
  );
}
