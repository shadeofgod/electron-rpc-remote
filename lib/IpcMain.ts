import { ipcMain, IpcMainEvent, WebContents } from 'electron';
import { serializeError } from './serializeError';
import { IPC_CHANNEL } from './common';
import {
  Packet,
  PacketType,
  createRequest,
  createResponse,
  Handles,
} from './protocol';

export class IpcMain {
  private _handles: Handles = {};

  private _invokePromises = new Map<
    number,
    {
      resolve: (value?: unknown) => void;
      reject: (reason?: any) => void;
    }
  >();

  constructor() {
    ipcMain.on(IPC_CHANNEL, this.internalHandle.bind(this));
  }

  private rejector(event: IpcMainEvent, e: Error, id: number) {
    const err = serializeError(e);
    event.reply(IPC_CHANNEL, createResponse(id, true, err));
  }

  private resolver(event: IpcMainEvent, val: any, id: number) {
    event.reply(IPC_CHANNEL, createResponse(id, false, val));
  }

  private internalHandle(event: IpcMainEvent, packet: Packet) {
    if (packet.type === PacketType.REQUEST) {
      const { method, args, id } = packet;
      if (method in this._handles) {
        new Promise((resolve, reject) => {
          try {
            resolve(this._handles[method].apply(null, Array.isArray(args) ? args : [args]));
          } catch (e) {
            reject(e);
          }
        })
          .then(val => this.resolver(event, val, id))
          .catch(e => this.rejector(event, e, id));
      }
    } else if (packet.type === PacketType.RESPONSE) {
      const { id, response, error } = packet;

      if (!this._invokePromises.has(id)) {
        throw new Error('the invoker in main process has been released');
      }

      if (error) {
        this._invokePromises.get(id)!.reject(response);
      } else {
        this._invokePromises.get(id)!.resolve(response);
      }

      this._invokePromises.delete(id);
    }
  }

  public handle(obj: Handles) {
    const methods = Object.keys(obj);
    for (const m of methods) {
      if (m in this._handles) {
        throw new Error(
          `Found duplicated method named \`${m}\` in ipc.handle, do you really want to overwrite it?`
        );
      }
    }
    Object.assign(this._handles, obj);
  }

  public invokeRenderer(webContentId: number, method: string, args?: any) {
    return new Promise((resolve, reject) => {
      const req = createRequest(method, args);
      this._invokePromises.set(req.id, { resolve, reject });
      const wc = WebContents.fromId(webContentId);
      if (!wc) {
        reject(
          new Error(
            `Couldn't find the webContents instance with id ${webContentId}.`
          )
        );
        this._invokePromises.delete(req.id);
        return;
      }
      wc.send(IPC_CHANNEL, req);
    });
  }

  public invokeAllRenderers(method: string, args?: any) {
    return Promise.all(
      WebContents.getAllWebContents().map(wc => {
        return this.invokeRenderer(wc.id, method, args);
      })
    );
  }
}
