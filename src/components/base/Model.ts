import { IEvents } from "../../types/base/EventEmitter";

// Гарда для проверки на модель
export const isModel = (obj: unknown): obj is Model<any> => {
    return obj instanceof Model;
}

/**
 * Базовая модель, чтобы можно было отличить ее от простых объектов с данными
 */
export abstract class Model<T> {
    constructor(data: Partial<T>, protected events: IEvents) {
        Object.assign(this, data);
    }

    // Сообщить всем что модель поменялась
    emitChanges(event: string, payload?: object) {
        this.events.emit(event, payload ?? {});
    }
}