import { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import io, { Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '../lib/types/socket';

let socket: any;

interface Message {
  id: string;
  text: string;
  timestamp: number;
}

const SocketComponent = () => {
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const username = 'User'; // You can make this dynamic

  useEffect(() => {
    const initSocket = async () => {
      try {
        await fetch('/api/socketio');
        socket = io({
          path: '/api/socketio',
        });

        socket.on('connect', () => {
          console.log('Connected to Socket.IO');
          setConnected(true);
        });

        socket.on('message', (data: string) => {
          const newMessage: Message = {
            id: Math.random().toString(36).substr(2, 9),
            text: data,
            timestamp: Date.now(),
          };
          setMessages((prevMessages) => [...prevMessages, newMessage]);
        });

        socket.on('userTyping', (typingUsername: string) => {
          setTypingUsers((prev) => {
            const newSet = new Set(prev);
            newSet.add(typingUsername);
            // Remove user from typing after 2 seconds
            setTimeout(() => {
              setTypingUsers((latest) => {
                const updatedSet = new Set(latest);
                updatedSet.delete(typingUsername);
                return updatedSet;
              });
            }, 2000);
            return newSet;
          });
        });

        return () => {
          if (socket) socket.close();
        };
      } catch (error) {
        console.error('Socket initialization error:', error);
        setConnected(false);
      }
    };

    initSocket();
  }, []);

  const handleTyping = (e: ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    socket?.emit('typing', username);
  };

  const sendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && socket) {
      socket.emit('message', message);
      setMessage('');
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <p>Status: {connected ? 'Connected' : 'Connecting...'}</p>
      </div>

      <div className="mb-4 h-48 overflow-y-auto border p-2">
        {messages.map((msg) => (
          <div key={msg.id} className="mb-2">
            <span className="text-gray-500 text-sm">
              {new Date(msg.timestamp).toLocaleTimeString()}{' '}
            </span>
            {msg.text}
          </div>
        ))}
      </div>

      {typingUsers.size > 0 && (
        <div className="text-sm text-gray-500 mb-2">
          {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={handleTyping}
          className="flex-1 border p-2"
          placeholder="Type a message..."
        />
        <button
          type="submit"
          className="bg-blue-500 px-4 py-2 text-white"
          disabled={!connected}
        >
          Send
        </button>
      </form>
    </div>
  )
};

export default SocketComponent;