import { contextBridge, ipcRenderer } from 'electron';

interface ModType {
  name: string;
  author: string;
  game: number;
  file: {
    name: string;
    buffer: number[];
    size: number;
    type: string;
  };
}

contextBridge.exposeInMainWorld('db', {
  validateUser: (username: string, password: string): Promise<boolean> => 
    ipcRenderer.invoke('validateUser', username, password),
  addUser: (username: string, email: string, password: string): Promise<void> => 
    ipcRenderer.invoke('addUser', username, email, password),
  getAuthToken: (): Promise<string | undefined> => 
    ipcRenderer.invoke('getAuthToken'),
  getUsername: (): Promise<string | null> => 
    ipcRenderer.invoke('getUsername'),
  validateAuthToken: (token: string): Promise<boolean> => 
    ipcRenderer.invoke('validateAuthToken', token),
  clearLogin: (): Promise<void> => 
    ipcRenderer.invoke('clearLogin'),
  uploadMod: (token: string, mod: ModType): Promise<void> => 
    ipcRenderer.invoke('uploadMod', token, mod),
  getAllGames: (token: string): Promise<any[]> => 
    ipcRenderer.invoke('getAllGames', token)
});