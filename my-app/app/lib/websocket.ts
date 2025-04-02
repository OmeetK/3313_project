class WebSocketService {
  private socket: WebSocket | null = null;
  private connected = false;
  private callbacks: {[key: string]: (data: any) => void} = {};

  connect(url: string = 'ws://localhost:4000'): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.connected = true;
          resolve(true);
        };

        this.socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          // Call registered callbacks
          if (data.type && this.callbacks[data.type]) {
            this.callbacks[data.type](data);
          }
          
          // Call general message callback
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
    return this.connected && this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  sendCommand(command: string): void {
    if (!this.isConnected()) {
      throw new Error('WebSocket is not connected');
    }

    const message = {
      type: 'command',
      command: command
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

// Create a singleton instance
const websocketService = new WebSocketService();
export default websocketService;