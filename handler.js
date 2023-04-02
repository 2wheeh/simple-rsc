import * as ReactServerDom from 'react-server-dom-webpack/server.browser';
import { createElement } from 'react';
import fs from 'node:fs';
import { resolveDist, resolveServerDist } from './utils/index.js';

/** @type {import('@hattip/core').HattipHandler} */
export async function handler(context) {
	const { pathname, searchParams } = new URL(context.request.url);
	if (pathname === '/check') {
		return new Response("Server's running!");
	}
	if (pathname === '/') {
		const html = await fs.promises.readFile(
			new URL('./utils/templates/index.html', import.meta.url),
			'utf-8'
		);
		return new Response(html, {
			headers: { 'Content-type': 'text/html' }
		});
	}
	const searchParamsObject = Object.fromEntries(searchParams);
	if (pathname === '/rsc') {
		const App = await import(
			resolveServerDist(
				`page.js${
					// Invalidate cached module on every request in dev mode
					// WARNING: can cause memory leaks for long-running dev servers!
					process.env.NODE_ENV === 'development' ? `?invalidate=${Date.now()}` : ''
				}`
			).href
		);
		const bundleMap = JSON.parse(
			await fs.promises.readFile(resolveDist('bundleMap.json'), 'utf-8')
		);

		const ServerRoot = App.default;
		const stream = ReactServerDom.renderToReadableStream(
			createElement(ServerRoot, searchParamsObject),
			bundleMap
		);
		return new Response(stream, {
			// "Content-type" based on https://github.com/facebook/react/blob/main/fixtures/flight/server/global.js#L159
			headers: { 'Content-type': 'text/x-component' }
		});
	}
	return new Response('Not found', { status: 404 });
}
