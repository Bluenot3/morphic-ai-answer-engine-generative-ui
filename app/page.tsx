// app/page.tsx
import { generateId } from 'ai'

import { getModels } from '@/lib/config/models'
import { Chat } from '@/components/chat'
import ActionBar from '@/components/ActionBar' // direct import; safe since ActionBar is a client component

export default async function Page() {
  const id = generateId()
  const models = await getModels()

  return (
    <>
      <Chat id={id} models={models} />

      {/* Bottom utility bar: model switcher, copy/export/share, web toggle, reset */}
      <div className="mx-auto max-w-7xl px-4">
        <ActionBar currentModelId="openai:gpt-5" />
      </div>
    </>
  )
}
