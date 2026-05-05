import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import OnboardingFlow from "@/components/OnboardingFlow"

export default async function OnboardingPage() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const { data: record } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .single()

  if (record) {
    redirect("/dashboard")
  }

  return <OnboardingFlow />
}
