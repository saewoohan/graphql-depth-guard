export interface ICache<T> {
  set(key: string, value: T): Promise<void>;
  get(key: string): Promise<T | null>;
  clear(): Promise<void>;
}
