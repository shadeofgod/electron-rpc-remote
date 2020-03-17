import { ipcRenderer, IpcRendererEvent } from 'electron';
import { serializeError } from './serializeError';
import { IPC_CHANNEL } from './common';
import {
  Packet,
  PacketType,
  createRequest,
  createResponse,
  Handles,
} from './protocol';

export class IpcRenderer {
  private _handles: Handles = {};

  private _invokePromises = new Map<
    number,
    {
      resolve: (value?: unknown) => void;
      reject: (reason?: any) => void;
    }
  >();

  constructor() {
    ipcRenderer.on(IPC_CHANNEL, this.internalHandle.bind(this));
  }

  private rejector(event: IpcRendererEvent, e: Error, id: number) {
    const err = serializeError(e);
    const { senderId, sender } = event;

    if (senderId === 0) {
      // this means it was from main process see https://www.electronjs.org/docs/api/structures/ipc-renderer-event
      ipcRenderer.send(IPC_CHANNEL, createResponse(id, true, err));
    } else {
      sender.sendTo(senderId, IPC_CHANNEL, createResponse(id, true, err));
    }
  }

  private resolver(event: IpcRendererEvent, val: any, id: number) {
    const { senderId, sender } = event;
    if (senderId === 0) {
      ipcRenderer.send(IPC_CHANNEL, createResponse(id, false, val));
    } else {
      sender.sendTo(senderId, IPC_CHANNEL, createResponse(id, false, val));
    }
  }

  private internalHandle(event: IpcRendererEvent, packet: Packet) {
    if (packet.type === PacketType.REQUEST) {
      const { method, args, id } = packet;
      if (method in this._handles) {
        new Promise((resolve, reject) => {
          try {
            resolve(this._handles[method].apply(null,  Array.isArray(args) ? args : [args]));
          } catch (e) {
            reject(e);
          }
        })
          .then(val => this.resolver(event, val, id))
          .catch(e => this.rejector(event, e, id));
      } else {
        const err = new Error(
          `Can't find method named \`${method}\`, did you forget to call ipc.handle to register it.`
        );
        this.rejector(event, err, id);
      }
    } else if (packet.type === PacketType.RESPONSE) {
      const { id, response, error } = packet;

      if (!this._invokePromises.has(id)) {
        throw new Error('the invoker in renderer process has been released');
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

  public invokeMain(method: string, args?: any) {
    return new Promise((resolve, reject) => {
      const req = createRequest(method, args);
      this._invokePromises.set(req.id, { resolve, reject });
      ipcRenderer.send(IPC_CHANNEL, req);
    });
  }

  public invokeRenderer(webContentId: number, method: string, args?: any) {
    return new Promise((resolve, reject) => {
      const req = createRequest(method, args);
      this._invokePromises.set(req.id, { resolve, reject });
      ipcRenderer.sendTo(webContentId, IPC_CHANNEL, req);
    });
  }
}
