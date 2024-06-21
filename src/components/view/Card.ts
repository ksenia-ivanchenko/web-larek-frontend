import { CategoryType, IProduct } from '../../types';
import { CDN_URL, categorySelectors } from '../../utils/constants';
import { ensureElement, handlePrice } from '../../utils/utils';
import { Component } from '../base/Component';
import { Product } from '../model/Product';

interface ICardActions {
	onClick: (event: MouseEvent) => void;
}

export class Card extends Component<IProduct> {
	protected _title: HTMLElement;
	protected _category: HTMLElement;
	protected _image: HTMLImageElement;
	protected _price: HTMLElement;
	protected _description: HTMLElement;
	protected _button: HTMLButtonElement;
	protected _basketIndex: HTMLElement;
	protected _deleteFromBasketButton: HTMLButtonElement;

	constructor(
		protected blockName: string,
		container: HTMLElement,
		actions?: ICardActions
	) {
		super(container);

		this._title = ensureElement<HTMLElement>(`.${blockName}__title`, container);
		this._image = container.querySelector(`.${blockName}__image`);
		this._category = container.querySelector(`.${blockName}__category`);
		this._price = container.querySelector(`.${blockName}__price`);
		this._button = container.querySelector(`.${blockName}__button`);
		this._description = container.querySelector(`.${this.blockName}__text`);
		this._basketIndex = container.querySelector(`.basket__item-index`);
		this._deleteFromBasketButton =
			container.querySelector(`.basket__item-delete`);

		if (actions?.onClick) {
			if (this._button) {
				this._button.addEventListener('click', actions.onClick);
			} else {
				container.addEventListener('click', actions.onClick);
			}
		}

		if (this._deleteFromBasketButton) {
			this._deleteFromBasketButton.addEventListener('click', (evt) => {
				this.container.remove();
			});
		}
	}

	switchButtonText(item: IProduct) {
		if (item.inBasket) {
			this.setText(this._button, 'Убрать из корзины');
		} else {
			this.setText(this._button, 'В корзину');
		}
	}

	set id(value: string) {
		this.container.dataset.id = value;
	}

	get id(): string {
		return this.container.dataset.id || '';
	}

	set title(value: string) {
		this.setText(this._title, value);
	}

	get title(): string {
		return this._title.textContent || '';
	}

	set image(value: string) {
		if (this._image) {
			this.setImage(this._image, CDN_URL + value, this.title);
		}
	}

	set price(value: number | null) {
		this.setText(
			this._price,
			value ? handlePrice(value) + ' синапсов' : 'Бесценно'
		);

		// блокируем кнопку добавления в корзину для бесценного товара
		if (this._button && value === null) {
			this._button.disabled = true;
		}
	}

	set category(value: CategoryType) {
		if (this._category) {
			this.setText(this._category, value);
			this._category.classList.add(categorySelectors[value]);
		}
	}

	set description(value: string) {
		if (this._description) {
			this.setText(this._description, value);
		}
	}

	set basketIndex(value: number) {
		if (this._basketIndex) {
			this._basketIndex.textContent = value.toString();
		}
	}
}
