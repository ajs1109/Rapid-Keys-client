'use client'

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import { useSocket, ChatMessage } from '@/context/SocketContext';

const ChatDrawer: React.FC = () => {
  const { activeChatFriend, closeChat, chatMessages, sendDM } = useSocket();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages: ChatMessage[] = activeChatFriend
    ? (chatMessages[activeChatFriend.id] ?? [])
    : [];

  // Scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Clear input when switching conversations
  useEffect(() => {
    setInput('');
  }, [activeChatFriend?.id]);

  if (!activeChatFriend) return null;

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendDM(activeChatFriend.id, trimmed);
    setInput('');
  };

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed right-0 top-20 bottom-0 w-80 z-[45] flex flex-col bg-slate-900/95 backdrop-blur-xl border-l border-white/5 shadow-2xl">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0 bg-surface-container/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
            <MessageSquare size={14} />
          </div>
          <div>
            <div className="font-headline font-semibold text-sm text-on-surface leading-tight">
              {activeChatFriend.username}
            </div>
            <div className="text-[10px] text-on-surface-variant/60">Direct Message</div>
          </div>
        </div>
        <button
          onClick={closeChat}
          className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all"
        >
          <X size={14} />
        </button>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-on-surface-variant/40">
            <MessageSquare size={32} className="opacity-30" />
            <p className="text-xs italic text-center">
              Say hello to {activeChatFriend.username}!
            </p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex flex-col gap-0.5 ${msg.isOwn ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed break-words ${
                msg.isOwn
                  ? 'bg-primary/25 text-primary rounded-tr-sm'
                  : 'bg-surface-container-highest text-on-surface rounded-tl-sm'
              }`}>
                {msg.message}
              </div>
              <span className="text-[9px] text-on-surface-variant/40 px-1">
                {formatTime(msg.timestamp)}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-white/5 shrink-0 flex items-center gap-2 bg-surface-container/30">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={`Message ${activeChatFriend.username}…`}
          className="flex-1 min-w-0 bg-white/5 text-on-surface rounded-xl px-3 py-2 text-xs outline-none border border-white/5 focus:ring-1 focus:ring-secondary/40 placeholder:text-on-surface-variant/40"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="p-2 rounded-xl bg-secondary/10 text-secondary hover:bg-secondary/20 transition-all disabled:opacity-40 shrink-0"
          title="Send"
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  );
};

export default ChatDrawer;
