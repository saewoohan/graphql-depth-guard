export interface ICache {
  set(key: string, value: number): Promise<void>;
  get(key: string): Promise<number | null>;
  clear(): Promise<void>;
}
