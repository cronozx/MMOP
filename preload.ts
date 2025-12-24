import { contextBridge, ipcRenderer } from 'electron';
import { ModType, UserData, NotifiactionType } from './src/types/sharedTypes';

contextBridge.exposeInMainWorld('db', {
  validateUser: (username: string, password: string): Promise<boolean> => 
    ipcRenderer.invoke('validateUser', username, password),
  addUser: (username: string, email: string, password: string): Promise<void> => 
    ipcRenderer.invoke('addUser', username, email, password),
  getAllUsers: (token: string): Promise<UserData[] | null> => 
    ipcRenderer.invoke('getAllUsers', token),
  getAuthToken: (): Promise<string | undefined> => 
    ipcRenderer.invoke('getAuthToken'),
  getUserDataFromToken: (): Promise<{username: string, _id: string} | null> => 
    ipcRenderer.invoke('getUserDataFromToken'),
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
  updateModpack: (token: string, _id: string, updatedModpack: any): Promise<boolean> =>
    ipcRenderer.invoke('updateModpack', token, _id, updatedModpack),
  getAllModsForGame: (token: string, gameId: number): Promise<Array<{_id: string, name: string, author: string}>> =>
    ipcRenderer.invoke('getAllModsForGame', token, gameId),
  sendNotification: (token: string, _id: string, notification: NotifiactionType): Promise<Boolean> => 
    ipcRenderer.invoke('sendNotification', token, _id, notification),
  getNotifications: (token: string, _id: string): Promise<NotifiactionType[]> =>
    ipcRenderer.invoke('getNotifications', token, _id),
  markNotificationsAsRead: (token: string): Promise<void> => 
    ipcRenderer.invoke('markNotificationsAsRead', token),
  randUUID: (): Promise<string> => ipcRenderer.invoke('randUUID')
});