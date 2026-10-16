import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { root } from './paths.mjs';

export const albumRoot = resolve(root, 'album');

export function albumPhotos() {
  if (!existsSync(albumRoot)) return [];
  function scan(directory, prefix = '') {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
      const name = prefix + entry.name;
      if (entry.isDirectory()) return scan(resolve(directory, entry.name), name + '/');
      return entry.isFile() && /\.(jpe?g|png|webp|gif|avif)$/i.test(entry.name)
        ? ['/album/' + name.split('/').map(encodeURIComponent).join('/')]
        : [];
    });
  }
  return scan(albumRoot).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
}
