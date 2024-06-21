import { IEvents, EventName, Subscriber, EmitterEvent } from "../../types/base/EventEmitter";

export class EventEmitter implements IEvents {
    _events: Map<EventName, Set<Subscriber>>;

    constructor() {
        this._events = new Map<EventName, Set<Subscriber>>();
    }

    on<T extends object>(eventName: EventName, callback: (event: T) => void) {
        if (!this._events.has(eventName)) {
            this._events.set(eventName, new Set<Subscriber>());
        }
        this._events.get(eventName)?.add(callback);
    }

    off(eventName: EventName, callback: Subscriber) {
        if (this._events.has(eventName)) {
            this._events.get(eventName)!.delete(callback);
            if (this._events.get(eventName)?.size === 0) {
                this._events.delete(eventName);
            }
        }
    }

    emit<T extends object>(eventName: string, data?: T) {
        this._events.forEach((subscribers, name) => {
            if (name instanceof RegExp && name.test(eventName) || name === eventName) {
                subscribers.forEach(callback => callback(data));
            }
        });
    }

    onAll(callback: (event: EmitterEvent) => void) {
        this.on("*", callback);
    }

    offAll() {
        this._events = new Map<string, Set<Subscriber>>();
    }

    trigger<T extends object>(eventName: string, context?: Partial<T>) {
        return (event: object = {}) => {
            this.emit(eventName, {
                ...(event || {}),
                ...(context || {})
            });
        };
    }
}

