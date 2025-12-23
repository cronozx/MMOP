import { contextBridge, ipcRenderer } from 'electron';
import { ModType, UserData } from './src/types/sharedTypes';

contextBridge.exposeInMainWorld('db', {
  validateUser: (username: string, password: string): Promise<boolean> => 
    ipcRenderer.invoke('validateUser', username, password),
  addUser: (username: string, email: string, password: string): Promise<void> => 
    ipcRenderer.invoke('addUser', username, email, password),
  getAllUsers: (token: string): Promise<UserData[] | null> => 
    ipcRenderer.invoke('getAllUsers', token),
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
    ipcRenderer.invoke('getAllGames', token),
  createModpack: (token: string, modpackinfo: any): Promise<boolean> =>
    ipcRenderer.invoke('createModpack', token, modpackinfo),
  getAllModpacks: (token: string): Promise<any[]> =>
    ipcRenderer.invoke('getAllModpacks', token),
  updateModpack: (token: string, modpackName: string, updatedModpack: any): Promise<boolean> =>
    ipcRenderer.invoke('updateModpack', token, modpackName, updatedModpack),
  getAllModsForGame: (token: string, gameId: number): Promise<Array<{id: string, name: string, author: string}>> =>
    ipcRenderer.invoke('getAllModsForGame', token, gameId)
});