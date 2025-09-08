import { Suspense } from 'react'
import Link from 'next/link'

import { Plus } from 'lucide-react'

import { cn } from '@/lib/utils'

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger
} from '@/components/ui/sidebar'

import { ChatHistorySection } from './sidebar/chat-history-section'
import { ChatHistorySkeleton } from './sidebar/chat-history-skeleton'
import { IconLogo } from './ui/icons'

export default function AppSidebar() {
  return (
    <Sidebar
      side="left"
      variant="sidebar"
      collapsible="offcanvas"
      className="bg-black/40 backdrop-blur-xl border-r border-white/10"
    >
      <SidebarHeader className="flex flex-row justify-between items-center bg-white/5 backdrop-blur border-b border-white/10">
        <Link href="/" className="flex items-center gap-2 px-2 py-3">
          <IconLogo className={cn('size-5 text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]')} />
          <span
            className={cn(
              'font-semibold text-sm',
              'bg-gradient-to-r from-emerald-300 via-teal-200 to-white bg-clip-text text-transparent',
              'drop-shadow-[0_0_10px_rgba(16,185,129,0.25)]'
            )}
          >
            ZEN Edge
          </span>
        </Link>
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent className="flex flex-col px-2 py-4 h-full bg-black/30 backdrop-blur-sm">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/" className="flex items-center gap-2">
                <Plus className="size-4 text-emerald-300" />
                <span className="text-white/90">New</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="flex-1 overflow-y-auto">
          <Suspense fallback={<ChatHistorySkeleton />}>
            <ChatHistorySection />
          </Suspense>
        </div>
      </SidebarContent>
      <SidebarRail className="bg-black/30 backdrop-blur-sm border-l border-white/10" />
    </Sidebar>
  )
}
