export const StoreGetChannel = 'storeApi.get';
export const StoreSetChannel = 'storeApi.set';

export default interface StoreService {
  get(key: string);

  set(key: string, value: object | string | number);
}
