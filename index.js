const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let updateCancellationToken = null;

autoUpdater.autoDownload = false;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    mainWindow.loadFile('index.html');
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', () => {
    createWindow();
    autoUpdater.checkForUpdatesAndNotify();
    // setTimeout of 10 sec to see if update is available or not
    /*setTimeout(() => {
        //mainWindow.webContents.send('checkForUpdates');
        autoUpdater.checkForUpdates().then((downloadPromise) => {
            console.log('check for updates response:- ', downloadPromise)
            updateCancellationToken = downloadPromise.cancellationToken;
            dialog.showMessageBox(updateCancellationToken);
        });
    }, 1000 * 10);*/
    /*require('update-electron-app')({
        repo: 'git+https://github.com/shubhsurya06/autoupdate-electron.git',
        updateInterval: '5 minutes',
        notifyUser : true
    })*/
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});

ipcMain.on('app_version', (event) => {
    event.sender.send('app_version', { version: app.getVersion() });
});

autoUpdater.on('update-available', (info) => {
    console.log("update available, information = ", info);
    mainWindow.webContents.send('info', info);
    const options = {
        type: 'info',
        title: 'Update Available',
        message: `New update ${info.version} is available.\nDo you want to download it now?`,
        details: `${JSON.parse(info)}`,
        buttons: ["Yes", "No"]
    }
    dialog.showMessageBox(null, options).then((response) => {
        if (response.response === 0) {
            autoUpdater.downloadUpdate(updateCancellationToken).then((response) => {
                console.log('downloading update:- ', response)
                mainWindow.webContents.send("update_available", { type: "info", text: "Download started..." });
            });
            mainWindow.webContents.send('update_available');
        }
    });
    //mainWindow.webContents.send('update_available');
});

autoUpdater.on('update-downloaded', (info) => {
    console.log("update downloaded:- ", info)
    updateCancellationToken = null;
    mainWindow.webContents.send('update_downloaded', info);
});

autoUpdater.on('update-not-available', (info) => {
    console.log("update-not-available, ", info)
    mainWindow.webContents.send('update-not-available', info);
});

autoUpdater.on("error", (error) => {
    mainWindow.webContents.send("update_error", error);
});

ipcMain.on('restart_app', () => {
    console.log("restarting app")
    autoUpdater.quitAndInstall();
});
