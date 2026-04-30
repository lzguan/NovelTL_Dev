import { useRef } from "react"
import type { IDRepository, RequestEvent, RequestManager, Signal, UserEvent } from "./types"
import { FatalError, RequestError, TimeoutError } from "./types"


function withTimeout<T>(promise : Promise<T>, timeoutMs : number) : Promise<T> {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new TimeoutError(`Request timed out after ${timeoutMs} ms`))
        }, timeoutMs)
        promise.then((result) => {
            clearTimeout(timeoutId)
            resolve(result)
        }).catch((err) => {
            clearTimeout(timeoutId)
            reject(err)
        })
    })
}

export function useRequestManager(idRepo : IDRepository, controllerSignalHandler : (signal : Signal) => void, setErrors : (errors : Error[] | null) => void) : RequestManager {
    const requestQueueRef = useRef<RequestEvent[]>([])
    const userEventTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const debounceLock = useRef(false) // if true do not send any requests to server
    const requestLoopRunning = useRef(false)

    const isQueueEmpty = () => requestQueueRef.current.length === 0

    const enqueueRequest = (request : RequestEvent) => {
        requestQueueRef.current.push(request)
    }

    const handleSignal = (signal : Signal) => {
        controllerSignalHandler(signal)
    }

    const onUserEvent = (event : UserEvent) => {
        console.log("User event:", event)
        debounceLock.current = true
        if (userEventTimeoutRef.current) {
            clearTimeout(userEventTimeoutRef.current)
        }
        userEventTimeoutRef.current = setTimeout(() => {
            userEventTimeoutRef.current = null
            debounceLock.current = false
        }, 1000)
    }

    const send = async () => {
        const outgoing = []
        while (requestQueueRef.current.length > 0 && requestQueueRef.current[0].reserveList.every(({ id, kind, desiredState }) => idRepo.isReserveable(kind, id, desiredState))) {
            const request = requestQueueRef.current.shift()!
            request.reserveList.forEach(({ id, kind, desiredState }) => idRepo.reserveIdObjState(kind, id, desiredState))
            outgoing.push(request)
        }
        if (outgoing.length === 0) {
            throw new FatalError("Unexpected: no requests are ready to be sent")
        }
        let responses : PromiseSettledResult<Signal>[] = []
        try {
            responses = await Promise.allSettled(outgoing.map((request) => withTimeout(request.callback(), 5000)))
        } catch (err) {
            console.error("Error occurred while sending requests:", err)
            outgoing.forEach((request) => {
                request.reserveList.forEach(({ id, kind }) => idRepo.releaseIdObjStateOnFailure(kind, id))
            })
            if (err instanceof FatalError) {
                setErrors([err])
            }
            else if (err instanceof TimeoutError || err instanceof RequestError) {
                setErrors([err])
            }
            else {
                setErrors([new RequestError(String(err), err)])
            }
            return
        }

        const errors : Error[] = []
        const signals = []
        for (let i = 0; i < responses.length; i++) {
            const response = responses[i]
            const request = outgoing[i]
            if (response.status === "rejected") {
                errors.push(response.reason instanceof TimeoutError || response.reason instanceof RequestError ? response.reason : new RequestError(String(response.reason), response.reason))
                request.reserveList.forEach(({ id, kind }) => idRepo.releaseIdObjStateOnFailure(kind, id))
            }
            else {
                request.reserveList.forEach(({ id, kind }) => idRepo.releaseIdObjStateOnSuccess(kind, id))
                if (response.value) {
                    signals.push(response.value)
                }
            }
        }
        if (errors.length > 0) {
            console.error("Errors occurred while sending requests:", errors)
            setErrors(errors)
        }
        else {
            setErrors(null)
        }
        signals.forEach((signal) => handleSignal(signal))
    }

    const start = async () => {
        if (requestLoopRunning.current) {
            return
        }
        requestLoopRunning.current = true

        try {
            while(!isQueueEmpty()) {
                if (debounceLock.current) {
                    await new Promise((resolve) => {
                        setTimeout(resolve, 100)
                    })
                }
                else {
                    await send()
                }
            }
        } catch (err) {
            console.error("Error occurred in request loop:", err)
            if (err instanceof FatalError) {
                setErrors([err])
            }
            else if (err instanceof TimeoutError || err instanceof RequestError) {
                setErrors([err])
            }
            else {
                setErrors([new RequestError(String(err), err)])
            }
        } finally {
            requestLoopRunning.current = false
        }
    }

    return {
        isQueueEmpty,
        enqueueRequest,
        handleSignal,
        onUserEvent,
        send,
        start,
    }
}
