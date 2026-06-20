"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { ConversationList } from "@/components/conversations/conversation-list";
import { ChatView } from "@/components/conversations/chat-view";
import { ContactPanel } from "@/components/conversations/contact-panel";
import { NewConversationDialog } from "@/components/conversations/new-conversation-dialog";

export default function ConversationsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showContactPanel, setShowContactPanel] = useState(true);
  const [showNewConv, setShowNewConv] = useState(false);

  const conversationsQuery = trpc.conversation.list.useQuery();
  const selectedConversation = trpc.conversation.getById.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId }
  );
  const messagesQuery = trpc.conversation.messages.useQuery(
    { conversationId: selectedId!, limit: 50 },
    { enabled: !!selectedId, refetchInterval: 3000 }
  );

  return (
    <div className="-m-4 flex h-[calc(100vh-3.5rem)] md:-m-6">
      {/* Column 1: Conversation List */}
      <div
        className={`w-full shrink-0 border-r md:w-80 ${
          selectedId ? "hidden md:block" : ""
        }`}
      >
        <ConversationList
          conversations={conversationsQuery.data ?? []}
          isLoading={conversationsQuery.isLoading}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onNewConversation={() => setShowNewConv(true)}
        />
      </div>

      {/* Column 2: Chat */}
      {selectedId ? (
        <div className="flex flex-1 flex-col">
          <ChatView
            conversation={selectedConversation.data ?? null}
            messages={messagesQuery.data?.messages ?? []}
            isLoading={messagesQuery.isLoading}
            onBack={() => setSelectedId(null)}
            onToggleContactPanel={() => setShowContactPanel(!showContactPanel)}
            onRefresh={() => {
              conversationsQuery.refetch();
              messagesQuery.refetch();
              selectedConversation.refetch();
            }}
          />
        </div>
      ) : (
        <div className="hidden flex-1 items-center justify-center md:flex">
          <p className="text-sm text-muted-foreground">
            Selecione uma conversa para visualizar
          </p>
        </div>
      )}

      {/* Column 3: Contact Info Panel */}
      {selectedId && showContactPanel && selectedConversation.data && (
        <div className="hidden w-72 shrink-0 border-l lg:block">
          <ContactPanel conversation={selectedConversation.data} />
        </div>
      )}
      <NewConversationDialog
        open={showNewConv}
        onOpenChange={setShowNewConv}
        onSuccess={(convId) => {
          setShowNewConv(false);
          conversationsQuery.refetch();
          setSelectedId(convId);
        }}
      />
    </div>
  );
}
