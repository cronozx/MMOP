import {app, BrowserWindow, ipcMain} from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { addUser, connectDB, disconnectDB, validateUser, validateWebToken, getUsernameFromToken } from './src/main/database/database.js';
import store from './src/main/utils/store.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

if (process.env.NODE_ENV !== 'production') {
    require('electron-reload')(__dirname, {
        electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
        hardResetMethod: 'exit'
    });
}

const createIPCHandlers = () => {
    ipcMain.handle('addUser', async (e, username, email, password) => {
        return await addUser(username, email, password);
    });

    ipcMain.handle('validateUser', async (e, username, password) => {
        return await validateUser(username, password);
    });

    ipcMain.handle('getAuthToken', () => {
        return store.get('authToken');
    });

    ipcMain.handle('getUsername', () => {
        return getUsernameFromToken();
    })

    ipcMain.handle('validateAuthToken', (e, token) => {
        return validateWebToken(token);
    });

    ipcMain.handle('clearLogin', () => {
        store.delete('authToken')
    })
}

const createWindow = () => {
    const window = new BrowserWindow({
        height: 800,
        width: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'public', 'icon.png')
    })

    window.loadFile('dist/index.html')
}

app.whenReady().then(async () => {
    await connectDB().catch('Could not start DB connection')
    createIPCHandlers()
    createWindow()
})

app.on('quit', async () => {
    await disconnectDB()
})