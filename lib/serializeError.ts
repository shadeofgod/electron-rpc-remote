const properties = [
	'name',
	'message',
	'stack',
	'code'
];

interface ObjectLike {
  [key: string]: any;
}

export function serializeError(from: ObjectLike) {
  if (typeof from === 'object' && from !== null) {
    const to: ObjectLike = {};
    for (const p of properties) {
      if (typeof from[p] === 'string') {
        to[p] = from[p];
      }
    }
    return to;
  }

  return from;
}
