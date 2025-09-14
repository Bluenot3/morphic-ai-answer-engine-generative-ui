// app/page.tsx
import dynamic from 'next/dynamic'
import { generateId } from 'ai'

import { getModels } from '@/lib/config/models'
import { Chat } from '@/components/chat'

// Dynamically load the client-only ActionBar (disables SSR for window/navigator usage)
const ActionBar = dynamic(() => import('@/components/ActionBar'), { ssr: false })

export default async function Page() {
  const id = generateId()
  const models = await getModels()

  return (
    <>
      <Chat id={id} models={models} />

      {/* Bottom utility bar: model switcher, copy/export/share, web toggle, reset */}
      <div className="mx-auto max-w-7xl px-4">
        {/* You can wire real handlers later; the component works fine without them */}
        <ActionBar currentModelId="openai:gpt-5" />
      </div>
    </>
  )
}
