// my-app/app/lib/websocket.ts

class WebSocketService {
  private socket: WebSocket | null = null;
  private connected = false;
  private connecting = false;
  private callbacks: { [key: string]: (data: any) => void } = {};

  // Connect only once; subsequent calls return the existing connection.
  connect(url: string = 'ws://localhost:4000'): Promise<boolean> {
    // If already connected, return immediately
    if (this.isConnected()) {
      return Promise.resolve(true);
    }

    // If currently connecting, wait for connection
    if (this.connecting) {
      return new Promise((resolve, reject) => {
        const checkConnection = () => {
          if (this.isConnected()) {
            resolve(true);
          } else if (!this.connecting) {
            reject(new Error('WebSocket connection failed'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

    this.connecting = true;

    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(url);
        
        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.connected = true;
          this.connecting = false;
          resolve(true);
        };
        
        this.socket.onmessage = (event) => {
          console.log('Raw WebSocket message received:', event.data);
          
          let data;
          try {
            // Try to parse the event data as JSON
            data = JSON.parse(event.data);
            console.log('Parsed WebSocket message:', JSON.stringify(data, null, 2));
          } catch (parseError) {
            // If parsing fails, create a basic response object
            console.error('Failed to parse WebSocket message:', parseError);
            data = { 
              type: 'server', 
              response: event.data,
              parseError: parseError.message
            };
            console.log('Unparsed WebSocket message:', data);
          }
          
          // Log the entire parsed data for debugging
          console.log('Detailed WebSocket message:', JSON.stringify(data, null, 2));
          
          // Trigger type-specific callbacks
          if (data.type && this.callbacks[data.type]) {
            this.callbacks[data.type](data);
          }
          
          // Always trigger generic message callback
          if (this.callbacks['message']) {
            this.callbacks['message'](data);
          }
        };
        
        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.connected = false;
          this.connecting = false;
          
          // Trigger error callback if exists
          if (this.callbacks['error']) {
            this.callbacks['error'](error);
          }
          
          reject(error);
        };
        
        this.socket.onclose = (event) => {
          console.log('WebSocket disconnected:', event);
          this.connected = false;
          this.connecting = false;
          
          // Trigger close callback if exists
          if (this.callbacks['close']) {
            this.callbacks['close'](event);
          }
        };
      } catch (error) {
        console.error('WebSocket connection error:', error);
        this.connecting = false;
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
    // Attempt to connect if not connected
    if (!this.isConnected()) {
      this.connect().then(() => {
        this._sendCommandInternal(command);
      }).catch(err => {
        console.error('Failed to connect before sending command:', err);
        throw new Error('WebSocket is not connected');
      });
    } else {
      this._sendCommandInternal(command);
    }
  }

  private _sendCommandInternal(command: string): void {
    const message = {
      type: 'command',
      command: command,
    };
    
    console.log('Sending WebSocket command:', JSON.stringify(message));
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
      this.connecting = false;
    }
  }
}

const websocketService = new WebSocketService();
export default websocketService;