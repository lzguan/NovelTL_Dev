import { Data } from "effect";
import type { RequestKey } from "./requestTypes";
import type { TimeoutException } from "effect/Cause";

export class CacheConflictException extends Data.TaggedError("CacheConflictException")<{
	requestKey: RequestKey;
}> {}

export class NoCacheEntryException extends Data.TaggedError("NoCacheEntryException")<{
	requestKey: RequestKey;
}> {}

export class ConnectionException extends Data.TaggedError("ConnectionException")<{
	orig: unknown;
}> {}

export class FatalException extends Data.TaggedError("FatalException")<{
	orig?: unknown;
}> {}

export class NotFoundException extends Data.TaggedError("NotFoundException")<{}> {}

export class NotReserveableException extends Data.TaggedError("NotReserveableException")<{}> {}

export class PendingException extends Data.TaggedError("PendingException")<{}> {}

export type AnyError =
	| FatalException
	| ConnectionException
	| CacheConflictException
	| NoCacheEntryException
	| NotFoundException
	| NotReserveableException
	| TimeoutException
	| PendingException;
