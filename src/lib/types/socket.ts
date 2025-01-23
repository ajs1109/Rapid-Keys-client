export interface ServerToClientEvents {
    message: (data: string) => void;
    userTyping: (username: string) => void;
  }
  
  export interface ClientToServerEvents {
    message: (data: string) => void;
    typing: (username: string) => void;
  }
  