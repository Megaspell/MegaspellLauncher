export default interface StoreService {
  get(key: string): object | string | number | null | undefined;

  set(key: string, value: object | string | number): void;

  delete(key: string): void;
}
