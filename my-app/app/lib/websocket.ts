// my-app/app/lib/websocket.ts

class WebSocketService {
  private socket: WebSocket | null = null;
  private connected = false;
  private callbacks: { [key: string]: (data: any) => void } = {};

  // Connect only once; subsequent calls return the existing connection.
  connect(url: string = 'ws://localhost:4000'): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        resolve(true);
        return;
      }
      try {
        this.socket = new WebSocket(url);
        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.connected = true;
          resolve(true);
        };
        this.socket.onmessage = (event) => {
          let data;
          try {
            data = JSON.parse(event.data);
          } catch {
            data = { response: event.data };
          }
          console.log('WebSocket message received:', data);
          if (data.type && this.callbacks[data.type]) {
            this.callbacks[data.type](data);
          }
          if (this.callbacks['message']) {
            this.callbacks['message'](data);
          }
        };
        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
        this.socket.onclose = () => {
          console.log('WebSocket disconnected');
          this.connected = false;
        };
      } catch (error) {
        console.error('WebSocket connection error:', error);
        reject(error);
      }
    });
  }

  isConnected(): boolean {
    return (
      this.connected &&
      this.socket !== null &&
      this.socket.readyState === WebSocket.OPEN
    );
  }

  sendCommand(command: string): void {
    if (!this.isConnected()) {
      throw new Error('WebSocket is not connected');
    }
    const message = {
      type: 'command',
      command: command,
    };
    this.socket?.send(JSON.stringify(message));
  }

  on(event: string, callback: (data: any) => void): void {
    this.callbacks[event] = callback;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.connected = false;
    }
  }
}

const websocketService = new WebSocketService();
export default websocketService;
