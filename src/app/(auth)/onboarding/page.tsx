import { redirect } from "next/navigation";

/**
 * Onboarding page — redirects to /register.
 * Kept for backward compatibility with old links.
 */
export default function OnboardingPage() {
  redirect("/register");
}
