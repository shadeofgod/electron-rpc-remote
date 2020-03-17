const { app, BrowserWindow } = require('electron');

const ipc = require('..');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let count = 0;

ipc.handle({
  inc() {
    count++;
    return count;
  },

  async incAsync() {
    await delay(1000);
    count++;
    await delay(1000);
    return count;
  },

  incError() {
    throw new Error('lalala')
  },

  async incAsyncError() {
    await delay(2000);
    throw new Error('hahaha')
  },

  add(...numbers) {
    return numbers.reduce((a, b) => a + b, 0);
  },

  addOne(n) {
    return n + 1;
  }
})

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 500,
    height: 500,
    show: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  });
  mainWindow.loadFile('index.html');
}
app.on('ready', () => {
  createWindow();
  // createWindow();
});
app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', function() {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});