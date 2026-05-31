import { redirect } from "next/navigation";

// Root just forwards to the dashboard. Middleware bounces unauthenticated
// visitors to /signin before this runs.
export default function Home() {
  redirect("/dashboard");
}
