"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import Loading from "@/app/loading";
import { ChevronLeft } from "lucide-react";

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
  const [isMobileView, setIsMobileView] = useState(false);
  const [showConversation, setShowConversation] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10); // For lazy loading

  const conversation = useQuery(
    api.messages.getConversation,
    selectedPartner ? { otherUserId: selectedPartner.userId } : "skip"
  );

  const sendMessage = useMutation(api.messages.sendMessage);
  const markAsRead = useMutation(api.messages.markMessagesAsRead);

  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationsRef = useRef<HTMLDivElement>(null);

  // Get unread message counts
  const unreadCount = useQuery(api.messages.getUnreadMessageCount);

  // Check if mobile view on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle selecting a partner
  useEffect(() => {
    if (selectedPartner && isMobileView) {
      setShowConversation(true);
    }
  }, [selectedPartner, isMobileView]);

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

  // Lazy loading for conversations
  useEffect(() => {
    const handleScroll = () => {
      if (conversationsRef.current) {
        const { scrollTop, scrollHeight, clientHeight } =
          conversationsRef.current;

        if (
          scrollTop + clientHeight >= scrollHeight - 20 &&
          chatPartners &&
          visibleCount < chatPartners.filter((p) => p.role === "clinic").length
        ) {
          setVisibleCount((prev) =>
            Math.min(
              prev + 10,
              chatPartners?.filter((p) => p.role === "clinic").length || 0
            )
          );
        }
      }
    };

    const currentRef = conversationsRef.current;
    if (currentRef) {
      currentRef.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener("scroll", handleScroll);
      }
    };
  }, [chatPartners, visibleCount]);

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
      if (isMobileView) {
        setShowConversation(true);
      }
    }
  };

  const handleBackToConversations = () => {
    if (isMobileView) {
      setShowConversation(false);
    } else {
      setSelectedPartner(null);
    }
  };

  const handleSelectPartner = (partner: ChatPartner) => {
    setSelectedPartner(partner);
    if (isMobileView) {
      setShowConversation(true);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!user || chatPartners === undefined || allClinics === undefined) {
    return <Loading />;
  }

  // Only show visible partners for lazy loading
  const visiblePartners = chatPartners
    ? chatPartners
        .filter((partner: ChatPartner) => partner.role === "clinic")
        .slice(0, visibleCount)
    : [];

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)]">
      {/* Left sidebar - Chat partners - always visible on desktop, conditionally on mobile */}
      {(!isMobileView || !showConversation) && (
        <div className="flex flex-col w-full md:w-1/4 md:border-r border-gray-200 h-full overflow-hidden">
          {/* Title and New Chat button */}
          <div className="p-4 flex justify-between items-center border-b">
            <h2 className="text-lg font-bold">Messages</h2>
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

          {/* New chat form */}
          {showNewChatForm && (
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-medium mb-3">Start a new conversation</h3>
              <div className="flex flex-col gap-3">
                <select
                  value={selectedClinicId || ""}
                  onChange={(e) => setSelectedClinicId(e.target.value || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a clinic</option>
                  {allClinics.map((clinic: ClinicProfile) => (
                    <option key={clinic.clinicId} value={clinic.clinicId}>
                      {clinic.name}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={startNewConversation}
                  disabled={!selectedClinicId}
                  className="w-full"
                >
                  Start Chat
                </Button>
              </div>
            </div>
          )}

          {/* Conversations list */}
          <div ref={conversationsRef} className="flex-1 overflow-y-auto">
            <h3 className="text-sm font-medium p-3 border-b sticky top-0 bg-white z-10">
              Your Conversations
            </h3>

            {visiblePartners.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {visiblePartners.map((partner: ChatPartner) => {
                  const hasUnread =
                    unreadCount !== undefined && unreadCount > 0;

                  return (
                    <div
                      key={partner._id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedPartner?.userId === partner.userId
                          ? "bg-blue-50"
                          : ""
                      }`}
                      onClick={() => handleSelectPartner(partner)}
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
                {chatPartners &&
                  chatPartners.filter((p) => p.role === "clinic").length >
                    visibleCount && (
                    <div className="p-4 text-center text-sm text-gray-500">
                      Scroll for more conversations
                    </div>
                  )}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No conversations yet
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right side - Conversation - always visible on desktop, conditionally on mobile */}
      {(!isMobileView || showConversation) && (
        <div className="flex-1 flex flex-col h-full">
          {selectedPartner ? (
            <>
              {/* Chat header with back button */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mr-2"
                    onClick={handleBackToConversations}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
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
                            className={`max-w-[75%] px-4 py-2 rounded-lg ${
                              isFromMe
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-900"
                            }`}
                          >
                            <p className="break-words">{message.content}</p>
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
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    type="submit"
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    disabled={!messageText.trim()}
                  >
                    Send
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-4">
                <p className="text-gray-500">
                  Select a conversation to start chatting
                </p>
                {chatPartners &&
                  chatPartners.filter((p) => p.role === "clinic").length ===
                    0 &&
                  !showNewChatForm && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-400 mb-2">
                        No conversations yet
                      </p>
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
      )}
    </div>
  );
}
