export const isMain = process?.type === 'browser';

export const isRenderer = process?.type === 'renderer';

export const IPC_CHANNEL = '@@INTERNAL_IPC_CHANNEL';
