/**
 * Chat Page Component
 * Real-time messaging between matched users
 * Modern dark blue theme with typing animation
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { onAuthChange } from '@/firebase/auth';
import {
  getChat,
  getUserProfile,
  sendMessage,
  subscribeToMessages,
} from '@/firebase/firestore';
import { Chat, Message, UserProfile } from '@/types/models';

const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [_chat, setChat] = useState<Chat | null>(null);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        setCurrentUser(user.uid);
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Load chat and other user's profile
  useEffect(() => {
    if (!chatId || !currentUser) return;

    const loadChat = async () => {
      try {
        const chatDoc = await getChat(chatId);
        if (!chatDoc) {
          setError('Chat not found');
          setIsLoading(false);
          return;
        }
        setChat(chatDoc);

        const otherUserId = chatDoc.members.find((uid) => uid !== currentUser);
        if (!otherUserId) {
          setError('Invalid chat');
          setIsLoading(false);
          return;
        }

        const profile = await getUserProfile(otherUserId);
        if (profile) {
          setOtherUser(profile);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading chat:', err);
        setError('Failed to load chat');
        setIsLoading(false);
      }
    };

    loadChat();
  }, [chatId, currentUser]);

  // Subscribe to messages
  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = subscribeToMessages(chatId, (msgs) => {
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [chatId]);

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    setIsTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  // Copy phone number
  const handleCopyPhone = async () => {
    if (otherUser?.phone) {
      try {
        await navigator.clipboard.writeText(otherUser.phone);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  // Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !chatId || !currentUser) return;

    setIsSending(true);
    setIsTyping(false);

    try {
      await sendMessage(chatId, currentUser, newMessage.trim());
      setNewMessage('');
      inputRef.current?.focus();
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for message groups
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Group messages by date
  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';

    msgs.forEach((msg) => {
      const msgDate = formatDate(msg.createdAt);
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="chat-page loading-state">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading conversation...</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="chat-page error-state">
        <div className="error-container">
          <div className="error-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          <button className="back-btn" onClick={() => navigate('/map')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Map
          </button>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="chat-page">
      {/* Animated Background */}
      <div className="chat-bg">
        <div className="chat-bg-gradient"></div>
        <div className="chat-bg-pattern"></div>
      </div>

      {/* Header */}
      <header className="chat-header">
        <button className="header-back-btn" onClick={() => navigate('/map')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <div className="header-user">
          <div className="header-avatar">
            <span>{otherUser?.name?.charAt(0).toUpperCase() || '?'}</span>
            <div className="avatar-status online"></div>
          </div>
          <div className="header-info">
            <h2>{otherUser?.name || 'Unknown User'}</h2>
            <div className="header-phone">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span>{otherUser?.phone}</span>
              <button 
                className={`copy-btn ${copied ? 'copied' : ''}`} 
                onClick={handleCopyPhone}
                title="Copy phone number"
              >
                {copied ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button className="action-btn" title="Call">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Messages Container */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h3>Start the conversation</h3>
            <p>Say hello to {otherUser?.name}!</p>
          </div>
        ) : (
          messageGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="message-group">
              <div className="date-divider">
                <span>{group.date}</span>
              </div>
              {group.messages.map((message, index) => {
                const isSent = message.senderId === currentUser;
                const showAvatar = !isSent && (
                  index === 0 || 
                  group.messages[index - 1]?.senderId === currentUser
                );
                
                return (
                  <div
                    key={message.id}
                    className={`message ${isSent ? 'sent' : 'received'} ${showAvatar ? 'with-avatar' : ''}`}
                  >
                    {!isSent && showAvatar && (
                      <div className="message-avatar">
                        {otherUser?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="message-bubble">
                      <p className="message-text">{message.text}</p>
                      <div className="message-meta">
                        <span className="message-time">{formatTime(message.createdAt)}</span>
                        {isSent && (
                          <span className="message-status">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="typing-indicator">
            <div className="typing-avatar">
              {currentUser?.charAt(0).toUpperCase() || 'Y'}
            </div>
            <div className="typing-bubble">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form className="input-area" onSubmit={handleSendMessage}>
        <div className="input-container">
          <button type="button" className="emoji-btn" title="Emoji">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </button>
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type your message..."
            disabled={isSending}
            autoFocus
          />
          <button 
            type="submit" 
            className={`send-btn ${newMessage.trim() ? 'active' : ''}`}
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? (
              <div className="send-spinner"></div>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </div>
      </form>

      <style>{styles}</style>
    </div>
  );
};

const styles = `
  .chat-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    position: relative;
    overflow: hidden;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  /* Background */
  .chat-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  .chat-bg-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #0a1628 0%, #1a365d 50%, #0f172a 100%);
  }

  .chat-bg-pattern {
    position: absolute;
    inset: 0;
    background-image: 
      radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.06) 0%, transparent 40%),
      radial-gradient(circle at 40% 80%, rgba(6, 182, 212, 0.05) 0%, transparent 40%);
  }

  /* Loading & Error States */
  .chat-page.loading-state,
  .chat-page.error-state {
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #0a1628 0%, #1a365d 50%, #0f172a 100%);
  }

  .loading-container,
  .error-container {
    text-align: center;
    color: #94a3b8;
    padding: 40px;
  }

  .loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(59, 130, 246, 0.2);
    border-top-color: #3b82f6;
    border-radius: 50%;
    margin: 0 auto 20px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-icon {
    width: 70px;
    height: 70px;
    margin: 0 auto 20px;
    color: #ef4444;
  }

  .error-container h3 {
    color: #f1f5f9;
    margin: 0 0 8px;
    font-size: 20px;
  }

  .error-container p {
    margin: 0 0 24px;
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .back-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
  }

  .back-btn svg {
    width: 18px;
    height: 18px;
  }

  /* Header */
  .chat-header {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    background: linear-gradient(135deg, rgba(10, 22, 40, 0.95) 0%, rgba(26, 54, 93, 0.9) 100%);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(59, 130, 246, 0.2);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
  }

  .header-back-btn {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .header-back-btn:hover {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.4);
    color: #60a5fa;
    transform: translateX(-3px);
  }

  .header-back-btn svg {
    width: 20px;
    height: 20px;
  }

  .header-user {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .header-avatar {
    position: relative;
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 700;
    color: white;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
  }

  .avatar-status {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 3px solid #0a1628;
  }

  .avatar-status.online {
    background: #22c55e;
    box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
  }

  .header-info h2 {
    margin: 0;
    font-size: 17px;
    font-weight: 600;
    color: #f1f5f9;
  }

  .header-phone {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    font-size: 13px;
    color: #64748b;
  }

  .header-phone svg {
    width: 14px;
    height: 14px;
    color: #22c55e;
  }

  .copy-btn {
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #64748b;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-left: 4px;
  }

  .copy-btn:hover {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.4);
    color: #60a5fa;
  }

  .copy-btn.copied {
    background: rgba(34, 197, 94, 0.2);
    border-color: rgba(34, 197, 94, 0.4);
    color: #22c55e;
  }

  .copy-btn svg {
    width: 14px;
    height: 14px;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(34, 197, 94, 0.15);
    border: 1px solid rgba(34, 197, 94, 0.3);
    border-radius: 12px;
    color: #22c55e;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .action-btn:hover {
    background: rgba(34, 197, 94, 0.25);
    transform: scale(1.05);
  }

  .action-btn svg {
    width: 20px;
    height: 20px;
  }

  /* Messages Container */
  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
  }

  .messages-container::-webkit-scrollbar {
    width: 6px;
  }

  .messages-container::-webkit-scrollbar-track {
    background: transparent;
  }

  .messages-container::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.3);
    border-radius: 3px;
  }

  /* Empty Chat */
  .empty-chat {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 40px;
  }

  .empty-icon {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    animation: float 3s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  .empty-icon svg {
    width: 40px;
    height: 40px;
    color: #60a5fa;
  }

  .empty-chat h3 {
    margin: 0 0 8px;
    font-size: 20px;
    font-weight: 600;
    color: #f1f5f9;
  }

  .empty-chat p {
    margin: 0;
    font-size: 14px;
    color: #64748b;
  }

  /* Date Divider */
  .date-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 20px 0;
  }

  .date-divider span {
    padding: 6px 14px;
    background: rgba(30, 41, 59, 0.8);
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    color: #94a3b8;
    backdrop-filter: blur(10px);
  }

  /* Messages */
  .message {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    margin-bottom: 4px;
    animation: messageIn 0.3s ease-out;
  }

  @keyframes messageIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .message.sent {
    flex-direction: row-reverse;
  }

  .message.with-avatar {
    margin-top: 12px;
  }

  .message-avatar {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
    color: white;
    flex-shrink: 0;
  }

  .message.received:not(.with-avatar) {
    padding-left: 42px;
  }

  .message-bubble {
    max-width: 70%;
    padding: 12px 16px;
    border-radius: 18px;
    position: relative;
  }

  .message.sent .message-bubble {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border-bottom-right-radius: 6px;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
  }

  .message.received .message-bubble {
    background: rgba(30, 41, 59, 0.8);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(59, 130, 246, 0.15);
    border-bottom-left-radius: 6px;
  }

  .message-text {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: #f1f5f9;
    word-wrap: break-word;
  }

  .message-meta {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
    margin-top: 4px;
  }

  .message-time {
    font-size: 11px;
    color: rgba(148, 163, 184, 0.8);
  }

  .message.sent .message-time {
    color: rgba(255, 255, 255, 0.7);
  }

  .message-status {
    display: flex;
    color: rgba(255, 255, 255, 0.7);
  }

  .message-status svg {
    width: 14px;
    height: 14px;
  }

  /* Typing Indicator */
  .typing-indicator {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    padding-left: 0;
    margin-top: 12px;
  }

  .typing-avatar {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
    color: white;
  }

  .typing-bubble {
    background: rgba(30, 41, 59, 0.8);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(59, 130, 246, 0.15);
    padding: 16px 20px;
    border-radius: 18px;
    border-bottom-left-radius: 6px;
  }

  .typing-dots {
    display: flex;
    gap: 4px;
  }

  .typing-dots span {
    width: 8px;
    height: 8px;
    background: #60a5fa;
    border-radius: 50%;
    animation: typingBounce 1.4s infinite ease-in-out;
  }

  .typing-dots span:nth-child(1) {
    animation-delay: 0s;
  }

  .typing-dots span:nth-child(2) {
    animation-delay: 0.2s;
  }

  .typing-dots span:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes typingBounce {
    0%, 60%, 100% {
      transform: translateY(0);
      opacity: 0.4;
    }
    30% {
      transform: translateY(-8px);
      opacity: 1;
    }
  }

  /* Input Area */
  .input-area {
    position: relative;
    z-index: 10;
    padding: 16px 20px 24px;
    background: linear-gradient(135deg, rgba(10, 22, 40, 0.95) 0%, rgba(26, 54, 93, 0.9) 100%);
    backdrop-filter: blur(20px);
    border-top: 1px solid rgba(59, 130, 246, 0.2);
  }

  .input-container {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(15, 23, 42, 0.8);
    border: 2px solid rgba(59, 130, 246, 0.2);
    border-radius: 28px;
    padding: 6px 6px 6px 16px;
    transition: all 0.3s ease;
  }

  .input-container:focus-within {
    border-color: rgba(59, 130, 246, 0.5);
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  }

  .emoji-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: #64748b;
    cursor: pointer;
    border-radius: 50%;
    transition: all 0.2s ease;
  }

  .emoji-btn:hover {
    color: #fbbf24;
    background: rgba(251, 191, 36, 0.1);
  }

  .emoji-btn svg {
    width: 22px;
    height: 22px;
  }

  .input-container input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-size: 15px;
    color: #f1f5f9;
    padding: 10px 0;
  }

  .input-container input::placeholder {
    color: #64748b;
  }

  .send-btn {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border: none;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    opacity: 0.5;
  }

  .send-btn.active {
    opacity: 1;
  }

  .send-btn:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.5);
  }

  .send-btn:disabled {
    cursor: not-allowed;
  }

  .send-btn svg {
    width: 22px;
    height: 22px;
  }

  .send-spinner {
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  /* Responsive */
  @media (max-width: 600px) {
    .chat-header {
      padding: 12px 16px;
    }

    .header-back-btn,
    .action-btn {
      width: 38px;
      height: 38px;
    }

    .header-avatar {
      width: 42px;
      height: 42px;
      font-size: 18px;
    }

    .header-info h2 {
      font-size: 15px;
    }

    .messages-container {
      padding: 16px;
    }

    .message-bubble {
      max-width: 85%;
    }

    .input-area {
      padding: 12px 16px 20px;
    }
  }
`;

export default ChatPage;
