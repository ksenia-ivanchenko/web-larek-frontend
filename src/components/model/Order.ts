import { IOrder, IProduct, PaymentMethods } from '../../types';
import { Model } from '../base/Model';

export class Order extends Model<IOrder> {
	products: IProduct[] = [];
	total: number | null = null;
	payment: PaymentMethods;
	address: string = '';
	email: string = '';
	phone: string = '';
	valid: boolean = false;
	errors: Partial<Record<keyof IOrder, string>>;

	validateContacts() {
		const regExp = /(^((8|\+7)[\- ]?)?(\(?\d{3}\)?[\- ]?)?[\d\- ]{7,10}$)/;

		const errors: typeof this.errors = {};
		if (!this.email) {
			errors.email = 'укажите email';
		}

		if (!this.phone || !regExp.test(this.phone)) {
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
}
