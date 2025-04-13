"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import Loading from "@/app/loading";

type ClinicProfile = {
  _id: string;
  clinicId: string;
  name: string;
  email: string;
};

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

export default function PatientChat() {
  const { user } = useUser();
  const chatPartners = useQuery(api.messages.getChatPartners);
  const allClinics = useQuery(api.clinics.getAllApprovedClinics);
  const [selectedPartner, setSelectedPartner] = useState<ChatPartner | null>(
    null
  );
  const [showNewChatForm, setShowNewChatForm] = useState(false);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);

  const conversation = useQuery(
    api.messages.getConversation,
    selectedPartner ? { otherUserId: selectedPartner.userId } : "skip"
  );

  const sendMessage = useMutation(api.messages.sendMessage);
  const markAsRead = useMutation(api.messages.markMessagesAsRead);

  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get unread message counts
  const unreadCount = useQuery(api.messages.getUnreadMessageCount);

  useEffect(() => {
    if (selectedPartner && conversation) {
      // Mark messages from this sender as read
      markAsRead({ senderId: selectedPartner.userId });
    }
  }, [selectedPartner, conversation, markAsRead]);

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

  const startNewConversation = async () => {
    if (!selectedClinicId) return;

    const selectedClinic = allClinics?.find(
      (clinic: ClinicProfile) => clinic.clinicId === selectedClinicId
    );

    if (selectedClinic) {
      // Check if this clinic is already in chat partners
      const existingPartner = chatPartners?.find(
        (partner: ChatPartner) => partner.userId === selectedClinic.clinicId
      );

      if (existingPartner) {
        setSelectedPartner(existingPartner);
      } else {
        // Create a new chat partner object
        const newPartner: ChatPartner = {
          _id: selectedClinic._id,
          userId: selectedClinic.clinicId,
          email: selectedClinic.email || selectedClinic.name,
          role: "clinic",
        };
        setSelectedPartner(newPartner);
      }

      setShowNewChatForm(false);
      setSelectedClinicId(null);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!user || chatPartners === undefined || allClinics === undefined) {
    return <Loading />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Messages</h2>
        <Button
          onClick={() => {
            setShowNewChatForm(!showNewChatForm);
            if (showNewChatForm) {
              setSelectedClinicId(null);
            }
          }}
        >
          {showNewChatForm ? "Cancel" : "New Conversation"}
        </Button>
      </div>

      {showNewChatForm && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-medium mb-3">Start a new conversation</h3>
          <div className="flex gap-4">
            <select
              value={selectedClinicId || ""}
              onChange={(e) => setSelectedClinicId(e.target.value || null)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select a clinic</option>
              {allClinics.map((clinic: ClinicProfile) => (
                <option key={clinic.clinicId} value={clinic.clinicId}>
                  {clinic.name}
                </option>
              ))}
            </select>
            <Button onClick={startNewConversation} disabled={!selectedClinicId}>
              Start Chat
            </Button>
          </div>
        </div>
      )}

      <div className="flex h-[60vh] border rounded-lg overflow-hidden">
        {/* Left sidebar - Chat partners */}
        <div className="w-1/4 border-r border-gray-200 overflow-y-auto">
          <h3 className="text-sm font-medium p-3 border-b bg-gray-50">
            Your Conversations
          </h3>

          {chatPartners && chatPartners.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {chatPartners
                .filter((partner: ChatPartner) => partner.role === "clinic")
                .map((partner: ChatPartner) => {
                  // We should use a new API endpoint to check for unread messages per partner
                  // For now, just show a visual indicator if there are any unread messages
                  const hasUnread =
                    unreadCount !== undefined && unreadCount > 0; // This will highlight all chats if any messages are unread

                  return (
                    <div
                      key={partner._id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 ${
                        selectedPartner?.userId === partner.userId
                          ? "bg-blue-50"
                          : ""
                      }`}
                      onClick={() => setSelectedPartner(partner)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                              {partner.email.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-3">
                            <p
                              className={`text-sm font-medium text-gray-900 truncate max-w-[120px] ${hasUnread ? "font-bold" : ""}`}
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
            <div className="p-4 text-center text-gray-500 text-sm">
              No conversations yet
            </div>
          )}
        </div>

        {/* Right side - Conversation */}
        <div className="flex-1 flex flex-col">
          {selectedPartner ? (
            <>
              {/* Chat header */}
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
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
                  <div className="space-y-3">
                    {conversation.map((message: Message) => {
                      const isFromMe = message.senderId === user.id;

                      return (
                        <div
                          key={message._id}
                          className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                              isFromMe
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-900"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
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
                    <p className="text-gray-500 text-sm">
                      No messages yet. Start the conversation!
                    </p>
                  </div>
                )}
              </div>

              {/* Message input */}
              <div className="p-3 border-t border-gray-200">
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center"
                >
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <Button
                    type="submit"
                    className="px-4 py-2 rounded-r-md"
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
                  Select a conversation or start a new one
                </p>
                {chatPartners &&
                  chatPartners.length === 0 &&
                  !showNewChatForm && (
                    <div className="mt-3">
                      <Button
                        onClick={() => setShowNewChatForm(true)}
                        variant="outline"
                        size="sm"
                      >
                        Start New Conversation
                      </Button>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
