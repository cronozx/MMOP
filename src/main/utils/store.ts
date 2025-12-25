import Store from 'electron-store';

interface StoreType {
  authToken?: string;
}

const store = new Store<StoreType>();

export default store;