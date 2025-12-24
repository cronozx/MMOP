import {app, BrowserWindow, ipcMain} from 'electron';
import type { IpcMainInvokeEvent } from 'electron'
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { addUser, connectDB, disconnectDB, validateUser, validateWebToken, uploadMod, getAllGames, createModpack, getUsersModpacks, updateModpack, getAllModsForGame, getAllUsers, getUserDataFromToken, sendNotification, getNotifications, markNotificationsAsRead } from './src/main/database/database';
import store from './src/main/utils/store'
import { NotifiactionType } from './src/types/sharedTypes';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

if (process.env.NODE_ENV !== 'production') {
    require('electron-reload')(__dirname, {
        electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
        hardResetMethod: 'exit'
    });
}

const createIPCHandlers = (): void => {
    ipcMain.handle('addUser', async (_e: IpcMainInvokeEvent, username: string, email: string, password: string) => {
        return await addUser(username, email, password);
    });

    ipcMain.handle('validateUser', async (_e: IpcMainInvokeEvent, username: string, password: string) => {
        return await validateUser(username, password);
    });

    ipcMain.handle('getAllUsers', async (_e: IpcMainInvokeEvent, token: string) => {
        return await getAllUsers(token)
    });

    ipcMain.handle('getAuthToken', () => {
        return store.get('authToken');
    });

    ipcMain.handle('getUserDataFromToken', () => {
        return getUserDataFromToken();
    })

    ipcMain.handle('validateAuthToken', (_e: IpcMainInvokeEvent, token: string) => {
        return validateWebToken(token);
    });

    ipcMain.handle('clearLogin', () => {
        store.delete('authToken')
    });

    ipcMain.handle('uploadMod', async (_e: IpcMainInvokeEvent, token: string, mod: any) => {
        return await uploadMod(token, mod)
    });

    ipcMain.handle('getAllGames', async (_e: IpcMainInvokeEvent, token: string) => {
        return await getAllGames(token);
    });

    ipcMain.handle('createModpack', async (_e: IpcMainInvokeEvent, token: string, modpack: any) => {
        return await createModpack(token, modpack)
    });

    ipcMain.handle('getAllModpacks', async (_e: IpcMainInvokeEvent, token: string) => {
        return await getUsersModpacks(token);
    });

    ipcMain.handle('updateModpack', async (_e: IpcMainInvokeEvent, token: string, _id: string, updatedModpack: any) => {
        return await updateModpack(token, _id, updatedModpack);
    });

    ipcMain.handle('getAllModsForGame', async (_e: IpcMainInvokeEvent, token: string, gameId: number) => {
        return await getAllModsForGame(token, gameId);
    });

    ipcMain.handle('sendNotification', async (_e: IpcMainInvokeEvent, token: string, _id: string, notification: NotifiactionType) => {
        return await sendNotification(token, _id, notification);
    });

    ipcMain.handle('getNotifications', async (_e: IpcMainInvokeEvent, token: string, _id: string) => {
        return await getNotifications(token, _id);
    });

    ipcMain.handle('markNotificationsAsRead', async (_e: IpcMainInvokeEvent, token: string) => {
        return await markNotificationsAsRead(token);
    });

    ipcMain.handle('randUUID', () => randomUUID().toString()); 
}

const createWindow = (): void => {
    const window = new BrowserWindow({
        height: 800,
        width: 600,
        webPreferences: {
            preload: path.join(__dirname, 'dist', 'preload.js')
        },
        icon: path.join(__dirname, 'public', 'icon.png')
    })

    window.loadFile('dist/index.html')
}

app.whenReady().then(async () => {
    await connectDB().catch(() => console.error('Could not start DB connection'))
    createIPCHandlers()
    createWindow()
})

app.on('quit', async () => {
    await disconnectDB()
})