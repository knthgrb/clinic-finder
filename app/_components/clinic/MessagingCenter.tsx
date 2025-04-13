"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import Loading from "@/app/loading";
type ChatPartner = {
  _id: string;
  userId: string;
  email: string;
  role: string;
};

type Message = {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: number;
};

export default function MessagingCenter() {
  const { user } = useUser();
  const chatPartners = useQuery(api.messages.getChatPartners);
  const [selectedPartner, setSelectedPartner] = useState<ChatPartner | null>(
    null
  );
  const conversation = useQuery(
    api.messages.getConversation,
    selectedPartner ? { otherUserId: selectedPartner.userId } : "skip"
  );
  const sendMessage = useMutation(api.messages.sendMessage);
  const markAsRead = useMutation(api.messages.markMessagesAsRead);

  // Get unread message counts
  const unreadCount = useQuery(api.messages.getUnreadMessageCount);

  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedPartner && conversation) {
      // Mark messages from this sender as read
      markAsRead({ senderId: selectedPartner.userId });
    }
  }, [selectedPartner, conversation]);

  useEffect(() => {
    // Scroll to bottom when conversation changes
    scrollToBottom();
  }, [conversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner || !messageText.trim()) return;

    try {
      await sendMessage({
        receiverId: selectedPartner.userId,
        content: messageText.trim(),
      });
      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!user) {
    return <Loading />;
  }

  return (
    <div className="flex h-[70vh]">
      {/* Left sidebar - Chat partners */}
      <div className="w-1/4 border-r border-gray-200 overflow-y-auto">
        <h3 className="text-lg font-medium p-4 border-b">Conversations</h3>

        {chatPartners && chatPartners.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {chatPartners.map((partner: ChatPartner) => {
              // Check for unread messages
              const hasUnread = unreadCount !== undefined && unreadCount > 0;

              return (
                <div
                  key={partner._id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedPartner?.userId === partner.userId
                      ? "bg-blue-50"
                      : ""
                  }`}
                  onClick={() => setSelectedPartner(partner)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                          {partner.email.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="ml-3">
                        <p
                          className={`text-sm font-medium text-gray-900 ${hasUnread ? "font-bold" : ""}`}
                        >
                          {partner.email}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {partner.role}
                        </p>
                      </div>
                    </div>
                    {hasUnread && (
                      <div className="bg-blue-600 rounded-full h-3 w-3 ml-2"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No conversations yet
          </div>
        )}
      </div>

      {/* Right side - Conversation */}
      <div className="flex-1 flex flex-col">
        {selectedPartner ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                    {selectedPartner.email.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {selectedPartner.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {selectedPartner.role}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto">
              {conversation && conversation.length > 0 ? (
                <div className="space-y-4">
                  {conversation.map((message: Message) => {
                    const isFromMe = message.senderId === user.id;

                    return (
                      <div
                        key={message._id}
                        className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isFromMe
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-900"
                          }`}
                        >
                          <p>{message.content}</p>
                          <p
                            className={`text-xs mt-1 text-right ${
                              isFromMe ? "text-blue-200" : "text-gray-500"
                            }`}
                          >
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              )}
            </div>

            {/* Message input */}
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex items-center">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                  disabled={!messageText.trim()}
                >
                  Send
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500">
                Select a conversation to start chatting
              </p>
              {chatPartners && chatPartners.length === 0 && (
                <p className="text-sm text-gray-400 mt-2">
                  You'll see conversations here when patients message you
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
