export type Locale = 'en' | 'pt';

export function getLocaleFromPathname(pathname: string): Locale {
	return pathname === '/pt' || pathname.startsWith('/pt/') ? 'pt' : 'en';
}

export function stripLocalePrefix(pathname: string) {
	if (pathname === '/pt') return '/';
	if (pathname.startsWith('/pt/')) return pathname.slice(3) || '/';
	return pathname || '/';
}

const localizedPaths = new Set([
	'/',
	'/bjp',
	'/bjp/start',
	'/bjp/start/new',
	'/bjp/start/import',
	'/bjp/keys',
	'/bjp/settings',
	'/bjp/contract/create',
	'/bjp/contract/create/1',
	'/bjp/contract/create/2',
	'/bjp/contract/create/3',
	'/bjp/contract/create/4',
	'/bjp/contract/create/5',
	'/bjp/contract/join',
	'/bjp/contract/verify',
	'/bjp/multisig/start',
	'/bjp/multisig/deposit',
	'/bjp/multisig/continue',
	'/manifesto',
	'/wot',
	'/wot/login',
	'/wot/login/new',
	'/wot/login/import',
	'/wot/rate',
	'/wot/keys',
	'/wot/table',
	'/wot/graph',
	'/wot/query'
]);

export function getTopLevelLocalizedPath(pathname: string, targetLocale: Locale) {
	const basePath = stripLocalePrefix(pathname);

	let destination = '/';
	if (localizedPaths.has(basePath)) {
		destination = basePath;
	} else if (basePath.startsWith('/bjp')) {
		destination = '/bjp';
	} else if (basePath.startsWith('/wot')) {
		destination = '/wot';
	} else if (basePath.startsWith('/manifesto')) {
		destination = '/manifesto';
	}

	if (targetLocale === 'en') return destination;
	return destination === '/' ? '/pt' : `/pt${destination}`;
}
