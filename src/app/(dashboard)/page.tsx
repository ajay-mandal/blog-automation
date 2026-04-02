import { redirect } from "next/navigation";

// Root "/" redirects straight into the dashboard
export default function Home() {
  redirect("/sources");
}
