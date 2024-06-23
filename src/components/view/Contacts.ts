import { IContacts } from '../../types';
import { IEvents } from '../../types/base/EventEmitter';
import { ensureElement } from '../../utils/utils';
import { Form } from './Form';

export class Contacts extends Form<IContacts> {
	protected _email: HTMLInputElement;
	protected _phone: HTMLInputElement;

	constructor(container: HTMLFormElement, events: IEvents) {
		super(container, events);

		this._email = ensureElement<HTMLInputElement>(
			'.form__input[name=email]',
			container
		);
		this._email.addEventListener('click', () => {
			this.onInputChange('email', this._email.value);
		});

		this._phone = ensureElement<HTMLInputElement>(
			'.form__input[name=phone]',
			container
		);
		this._phone.addEventListener('click', () => {
			this.onInputChange('phone', this._phone.value);
		});
	}

	set email(value: string) {
		(this.container.elements.namedItem('email') as HTMLInputElement).value =
			value;
	}

  set phone(value: string) {
		(this.container.elements.namedItem('phone') as HTMLInputElement).value =
			value;
	}
}
