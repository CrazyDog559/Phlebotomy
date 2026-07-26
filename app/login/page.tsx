import LoginForm from "@/components/LoginForm";

// Rendered on demand (never statically pre-rendered at build time).
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <LoginForm />;
}
