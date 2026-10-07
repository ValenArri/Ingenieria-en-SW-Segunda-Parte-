import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const raiz = fileURLToPath(new URL('.', import.meta.url));
const tipos = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json' };
http.createServer(async (peticion, respuesta) => {
  try {
    const ruta = decodeURIComponent(new URL(peticion.url, 'http://localhost').pathname);
    const archivo = resolve(raiz, '.' + (ruta === '/' ? '/index.html' : ruta));
    if (!archivo.startsWith(raiz.endsWith(sep) ? raiz : raiz + sep)) throw new Error('Ruta inválida');
    const contenido = await readFile(archivo);
    respuesta.writeHead(200, { 'Content-Type': (tipos[extname(archivo)] || 'text/plain') + '; charset=utf-8', 'Cache-Control': 'no-store' });
    respuesta.end(contenido);
  } catch {
    respuesta.writeHead(404); respuesta.end('No se encontró el archivo.');
  }
}).listen(4173, '127.0.0.1', () => console.log('Mesa Abierta: http://127.0.0.1:4173'));
