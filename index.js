const {app, BrowserWindow} = require('electron');
const { addUser, connectDB, disconnectDB } = require('./main/database/database');

const createWindow = () => {
    const window = new BrowserWindow({
        height: 800,
        width: 600
    })

    
}

app.whenReady().then(async () => {
    await connectDB()
    createWindow()
})

app.on('quit', async () => {
    await disconnectDB()
})