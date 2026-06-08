export class TimeoutError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "TimeoutError";
	}
}

export class CacheConflictError extends Error {
	requestKey: string;
	constructor(message: string, requestKey: string) {
		super(message);
		this.name = "CacheConflictError";
		this.requestKey = requestKey;
	}
}

export class NoCacheEntryError extends Error {
	requestKey: string;
	constructor(message: string, requestKey: string) {
		super(message);
		this.name = "NoCacheEntryError";
		this.requestKey = requestKey;
	}
}

export class ConnectionError extends Error {
	orig: unknown;
	constructor(message: string, err: unknown) {
		super(message);
		this.name = "ConnectionError";
		this.orig = err;
	}
}

export class FatalError extends Error {
	orig?: unknown;
	constructor(message: string, orig?: unknown) {
		super(message);
		this.name = "FatalError";
		if (orig) {
			this.orig = orig;
		}
	}
}

export class NotFoundError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "NotFoundError";
	}
}
