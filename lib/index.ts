import { IpcMain } from './IpcMain';
import { IpcRenderer } from './IpcRenderer';
import { isMain } from './common';

const ipc = isMain ? new IpcMain() : new IpcRenderer();

export default ipc;
