import BottomTabBar from "@/components/BottomTabBar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="pb-20">{children}</div>
      <BottomTabBar />
    </>
  )
}
