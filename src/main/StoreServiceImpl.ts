import Store from 'electron-store';
import StoreService from '../common/StoreService';

export default class StoreServiceImpl implements StoreService {
  private store: Store;

  constructor() {
    this.store = new Store({
      defaults: undefined,
    });
  }

  get(key: string): object | string | number | null | undefined {
    return this.store.get(key) as object | string | number | null | undefined;
  }

  set(key: string, value: object | string | number): void {
    return this.store.set(key, value);
  }

  delete(key: string) {
    return this.store.delete(key);
  }
}
