const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('db', {
  validateUser: (username, password) => ipcRenderer.invoke('validateUser', username, password),
  addUser: (username, email, password) => ipcRenderer.invoke('addUser', username, email, password),
  getAuthToken: () => ipcRenderer.invoke('getAuthToken'),
  getUsername: () => ipcRenderer.invoke('getUsername'),
  validateAuthToken: (token) => ipcRenderer.invoke('validateAuthToken', token),
  clearLogin: () => ipcRenderer.invoke('clearLogin')
});