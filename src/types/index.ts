export type CategoryType =
	| 'софт-скил'
	| 'хард-скил'
	| 'дополнительное'
	| 'другое'
	| 'кнопка';
export interface IBasket {
	products: IProduct[];
	total: number | null;
}
export interface IProduct {
	id: string;
	title: string;
	category: CategoryType;
	description: string;
	image: string;
	price: number | null;
	inBasket: boolean;
}

export type PaymentMethods = 'онлайн' | 'при получении';

export interface IDeliveryDetails {
	payment: PaymentMethods;
	address: string;
}

export interface IContacts {
	email: string;
	phone: string;
}

export interface IFormValidation {
	valid: boolean;
	errors: Partial<Record<keyof IOrder, string>>;
}

export type IOrder = IBasket & IDeliveryDetails & IContacts & IFormValidation;

// export type FormErrors = Partial<Record<keyof IOrder, string>>;
