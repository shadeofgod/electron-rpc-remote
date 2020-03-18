# electron-rpc-remote

A library that provides RPC-styled API for electron ipc.

## Motivation

In Electron, There are several ways to communicate between the main process and renderer processes, such as `ipcRenderer`, `ipcMain` and `remote`.

`ipcRenderer` and `ipcMain` provides event-based APIs to send synchronous and asynchronous messages, you may have to frequently add and remove event listeners on it and it's easy to cause a memory leak. This makes it hard to maintain the code if there are lots of ipc calls everywhere or you often need to pass some data back and forth.

`remote` module is considered harmful and you should avoid to use it. for more information you can see [here](https://www.electronjs.org/docs/tutorial/security#15-disable-the-remote-module) and [here](https://medium.com/@nornagon/electrons-remote-module-considered-harmful-70d69500f31).

This package provides a RPC-styled API to ease the pain doing ipc calls in your Electron apps.

## Exampe

```js
// main
import ipc from 'electron-rpc-remote';

let count = 0;

ipc.handle({
  inc() {
    count++;
    return count;
  },
  async incAsync() {
    await delay(1000);
    count++;
    return count;
  },
})


// renderer
await ipc.invokeMain('inc'); // -> 1
```

## API

**_both processes_**

- **`ipc.handle(obj: Handles): void`**

```ts
interface Handles {
  [method: string]: (...args: any[]) => any;
}

ipc.handle({
  someMethod() {/** ... */}
})
```

**_`main` process_**

- **`ipc.invokeRenderer(webContentId: number, method: string, args?: any): Promise<any>`**
- **`ipc.invokeAllRenderers(method: string, args?: any): Promise<any>`**

**_`renderer` process_**

- **`ipc.invokeMain(method: string, args?: any): Promise<any>`**
- **`ipc.invokeRenderer(webContentId: number, method: string, args?: any): Promise<any>`**

## Warning

> All data passed across processes will be serialized with the Structured Clone Algorithm. Sending Functions, Promises, Symbols, WeakMaps, or WeakSets will throw an exception.

Also You should try to avoid sending **large objects** or **non-standard JavaScript types** such as DOM objects or special Electron objects.

## Recipes

- **get some values**

```js
// main
ipc.handle({
  getValueThatOnlyCanBeAccessedInMain() { return someValue }
});

// renderer
const val = await ipc.invokeMain('getValueThatOnlyCanBeAccessedInMain')
```

- **pass arguments**

```js
// main
ipc.handle({
  add(...numbers) {
    return numbers.reduce((a, b) => a + b, 0);
  }
});


// renderer
const val = await ipc.invokeMain('add', [1, 2, 3, 4, 5]);
```

- **open native dialog**

```js
// main
ipc.handle({
  async openNativeDialog({
    message,
    buttons = ['confirm', 'cancel'],
  }) {
    const res = await dialog.showMessageBox({
      message,
      buttons,
      type: 'question',
      defaultId: 0,
    });

    return res;
  }
});

// renderer
const res = await ipc.invokeMain('openNativeDialog', { message: 'hi?' });
if (res === 0) {
  // ...
}
```

- **show native notification**

```js
// main
ipc.handle({
  showNotification(options) {
    if (!Notification.isSupported()) {
      return false;
    }
    const instance = new Notification(Object.assign(defaultOptions, options));
    instance.show();
    return true;
  }
});

// renderer
const showed = await ipc.invokeMain('showNotification', { body: 'test notification!' });
```

- **from main process to renderer**

```js
// main
powerMonitor.on('suspend', () => {
  const focused = BrowserWindow.getFocusedWindow().webContents.id;
  ipc.invokeRenderer(focused, 'handlePowerSuspend');

  // or
  ipc.invokeAllRenderers('handlePowerSuspend')
});

// renderer
ipc.handle({
  handlePowerSuspend() {
    // ...
  }
});
```
