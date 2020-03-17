const id = require('electron').remote.getCurrentWebContents().id;
document.title = `window ${id}`;

let rotation = 0;
setInterval(
  () => (window.lol.style.transform = `rotate(${(rotation += 10) % 360}deg)`),
  10
);

const ipc = require('..');

document.querySelector('#inc1').addEventListener('click', async () => {
  const start = performance.now();
  const res = await ipc.invokeMain('inc');
  console.log('res: ', res, 'cost time: ', performance.now() - start);
});

document.querySelector('#inc2').addEventListener('click', async () => {
  const start = performance.now();
  const res = await ipc.invokeMain('incAsync');
  console.log('res: ', res, 'cost time: ', performance.now() - start);
});

document.querySelector('#inc3').addEventListener('click', async () => {
  const start = performance.now();
  const res = await ipc.invokeMain('incError');
  console.log('res: ', res, 'cost time: ', performance.now() - start);
});

document.querySelector('#inc4').addEventListener('click', async () => {
  const start = performance.now();
  const res = await ipc.invokeMain('incAsyncError');
  console.log('res: ', res, 'cost time: ', performance.now() - start);
});

document.querySelector('#inc5').addEventListener('click', async () => {
  const start = performance.now();
  const res = await ipc.invokeMain('add', [1,2,3,4,5]);
  console.log('res: ', res, 'cost time: ', performance.now() - start);
});

document.querySelector('#inc6').addEventListener('click', async () => {
  const start = performance.now();
  const res = await ipc.invokeMain('addOne', 1);
  console.log('res: ', res, 'cost time: ', performance.now() - start);
});

