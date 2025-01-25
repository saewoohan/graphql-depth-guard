import { ICache } from './ICache';

import { Socket } from 'net';

class RedisConnection {
  private socket: Socket;
  private buffer: string = '';

  constructor(
    private host: string,
    private port: number,
  ) {
    this.socket = new Socket();
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket.connect(this.port, this.host, () => resolve());
      this.socket.on('error', (err) => reject(err));
    });
  }

  sendCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.socket.write(command);

      this.socket.on('data', (data) => {
        this.buffer += data.toString();

        if (this.buffer.includes('\r\n')) {
          const response = this.buffer.trim();
          this.buffer = '';
          resolve(response);
        }
      });

      this.socket.on('error', (err) => reject(err));
    });
  }

  close(): void {
    this.socket.destroy();
  }
}

export class RedisCache<T> implements ICache<T> {
  private connection: RedisConnection;
  private ttl: number;

  constructor(ttl: number, host: string, port: number) {
    this.connection = new RedisConnection(host, port);
    this.ttl = ttl;
  }

  async connect(): Promise<void> {
    await this.connection.connect();
  }

  async set(key: string, value: T): Promise<void> {
    const serializedValue = JSON.stringify(value);
    const command = `*4\r\n$3\r\nSET\r\n$${key.length}\r\n${key}\r\n$${serializedValue.length}\r\n${serializedValue}\r\n$2\r\nEX\r\n${this.ttl}\r\n`;
    await this.connection.sendCommand(command);
  }

  async get(key: string): Promise<T | null> {
    const command = `*2\r\n$3\r\nGET\r\n$${key.length}\r\n${key}\r\n`;
    const response = await this.connection.sendCommand(command);

    if (response.startsWith('$-1')) {
      return null;
    }

    const value = response.split('\r\n')[1];
    return JSON.parse(value) as T;
  }

  async clear(): Promise<void> {
    const command = `*1\r\n$8\r\nFLUSHALL\r\n`;
    await this.connection.sendCommand(command);
  }

  close(): void {
    this.connection.close();
  }
}
