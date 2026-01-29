/**
 * Chat Page Component
 * Real-time messaging between matched users
 * Shows other user's phone number and profile info
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
        // Get chat document
        const chatDoc = await getChat(chatId);
        if (!chatDoc) {
          setError('Chat not found');
          setIsLoading(false);
          return;
        }
        setChat(chatDoc);

        // Find the other user's ID
        const otherUserId = chatDoc.members.find((uid) => uid !== currentUser);
        if (!otherUserId) {
          setError('Invalid chat');
          setIsLoading(false);
          return;
        }

        // Get other user's profile
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

  // Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !chatId || !currentUser) return;

    setIsSending(true);

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

  // Loading state
  if (isLoading) {
    return (
      <div className="chat-page loading">
        <div className="loading-spinner">
          <span>🔄</span>
          <p>Loading chat...</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="chat-page error">
        <div className="error-content">
          <span>❌</span>
          <p>{error}</p>
          <button onClick={() => navigate('/map')}>Back to Map</button>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="chat-page">
      {/* Header */}
      <header className="chat-header">
        <button className="back-button" onClick={() => navigate('/map')}>
          ← Back
        </button>
        <div className="chat-user-info">
          <h2>{otherUser?.name || 'Unknown User'}</h2>
          {otherUser && (
            <span className="phone-number">📞 {otherUser.phone}</span>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <span>💬</span>
            <p>No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message ${
                message.senderId === currentUser ? 'sent' : 'received'
              }`}
            >
              <div className="message-content">
                <p className="message-text">{message.text}</p>
                <span className="message-time">{formatTime(message.createdAt)}</span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form className="message-input-form" onSubmit={handleSendMessage}>
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={isSending}
          autoFocus
        />
        <button type="submit" disabled={!newMessage.trim() || isSending}>
          {isSending ? '⏳' : '📤'} Send
        </button>
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
    background: #f0f2f5;
  }

  .chat-page.loading,
  .chat-page.error {
    justify-content: center;
    align-items: center;
  }

  .loading-spinner,
  .error-content {
    text-align: center;
    color: #666;
  }

  .loading-spinner span,
  .error-content span {
    font-size: 48px;
    display: block;
    margin-bottom: 16px;
  }

  .loading-spinner span {
    animation: spin 2s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .error-content button {
    margin-top: 16px;
    padding: 10px 20px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
  }

  .chat-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .back-button {
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }

  .back-button:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .chat-user-info {
    flex: 1;
  }

  .chat-user-info h2 {
    margin: 0;
    font-size: 18px;
  }

  .phone-number {
    font-size: 13px;
    opacity: 0.9;
    background: rgba(255, 255, 255, 0.2);
    padding: 2px 8px;
    border-radius: 4px;
    display: inline-block;
    margin-top: 4px;
  }

  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .no-messages {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #999;
  }

  .no-messages span {
    font-size: 64px;
    margin-bottom: 16px;
  }

  .message {
    max-width: 70%;
    display: flex;
  }

  .message.sent {
    align-self: flex-end;
  }

  .message.received {
    align-self: flex-start;
  }

  .message-content {
    padding: 10px 14px;
    border-radius: 18px;
    position: relative;
  }

  .message.sent .message-content {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-bottom-right-radius: 4px;
  }

  .message.received .message-content {
    background: white;
    color: #333;
    border-bottom-left-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .message-text {
    margin: 0;
    font-size: 14px;
    line-height: 1.4;
    word-wrap: break-word;
  }

  .message-time {
    display: block;
    font-size: 11px;
    opacity: 0.7;
    margin-top: 4px;
    text-align: right;
  }

  .message-input-form {
    display: flex;
    gap: 12px;
    padding: 16px 20px;
    background: white;
    border-top: 1px solid #e0e0e0;
  }

  .message-input-form input {
    flex: 1;
    padding: 12px 16px;
    font-size: 14px;
    border: 2px solid #e0e0e0;
    border-radius: 24px;
    outline: none;
    transition: border-color 0.2s;
  }

  .message-input-form input:focus {
    border-color: #667eea;
  }

  .message-input-form button {
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 600;
    color: white;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 24px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .message-input-form button:hover:not(:disabled) {
    transform: scale(1.05);
  }

  .message-input-form button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 600px) {
    .message {
      max-width: 85%;
    }
  }
`;

export default ChatPage;
