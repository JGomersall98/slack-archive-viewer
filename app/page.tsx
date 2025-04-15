import { redirect } from "next/navigation"
import { getChannelList } from "@/lib/data"

export default async function Home() {
  const channels = await getChannelList()

  // Redirect to the first channel if available
  if (channels.length > 0) {
    redirect(`/channel/${channels[0].id}`)
  }

  return (
    <div className="flex items-center justify-center h-screen bg-slate-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Welcome to Slack Archive Viewer</h1>
        <p className="mb-4">No channels found. Please make sure your data is in the correct format.</p>
      </div>
    </div>
  )
}
