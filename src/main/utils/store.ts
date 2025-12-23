import Store from 'electron-store';
import { ModpackType } from '../../types/sharedTypes';

interface StoreType {
  authToken?: string;
  modpacks: ModpackType[]
}

const store = new Store<StoreType>();

export default store;