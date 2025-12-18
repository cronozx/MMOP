const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const { addUser, connectDB, disconnectDB, validateUser } = require('./main/database/database');
const { Navigate } = require('react-router-dom');

if (process.env.NODE_ENV !== 'production') {
    require('electron-reload')(__dirname, {
        electron: path.join(__dirname, 'node_modules', '.bin', 'electron.cmd'),
        hardResetMethod: 'exit'
    });
}

const createWindow = () => {
    const window = new BrowserWindow({
        height: 800,
        width: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    window.loadFile('dist/index.html')
}

app.whenReady().then(async () => {
    await connectDB()

    ipcMain.handle('addUser', async (e, username, email, password) => {
        return await addUser(username, email, password);
    });

    ipcMain.handle('validateUser', async (event, username, password) => {
        return await validateUser(username, password);
    });

    createWindow()
})

app.on('quit', async () => {
    await disconnectDB()
})