import { IOrder, PaymentMethods } from '../../types';
import { Model } from '../base/Model';

export class Order extends Model<IOrder> {
	items: string[] = [];
	total: number | null = null;
	payment: PaymentMethods = undefined;
	address: string = '';
	email: string = '';
	phone: string = '';
	valid: boolean = false;
	errors: Partial<Record<keyof IOrder, string>>;

	validateContacts() {
		const regExpPhone = /(^((8|\+7)[\- ]?)?(\(?\d{3}\)?[\- ]?)?[\d\- ]{7,10}$)/;
		const regExpEmail =
			/^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/iu;

		const errors: typeof this.errors = {};
		if (!this.email || !regExpEmail.test(this.email)) {
			errors.email = 'укажите корректный email';
		}

		if (!this.phone || !regExpPhone.test(this.phone)) {
			errors.phone = 'введите корректный номер';
		}
		this.errors = errors;
		this.events.emit('contactsErrors:change', this.errors);
		return Object.keys(errors).length === 0;
	}

	validateDeliveryDetails() {
		const errors: typeof this.errors = {};
		if (!this.payment) {
			errors.payment = 'выберите способ оплаты';
		}
		if (!this.address) {
			errors.address = 'укажите адрес';
		}
		this.errors = errors;
		this.events.emit('deliveryDetailsErrors:change', this.errors);
		return Object.keys(errors).length === 0;
	}

	removeOrderData() {
		this.items = [];
		this.total = null;
		this.payment = undefined;
		this.address = '';
		this.email = '';
		this.phone = '';
		this.valid = false;
		this.errors = {};
	}
}
