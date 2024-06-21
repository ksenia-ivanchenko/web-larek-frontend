import { IProduct } from '../../types';
import { Model } from '../base/Model';

export class BasketModel extends Model<IProduct> {
	products: IProduct[] = [];
	total: number | null;

	private getTotalBasketPrice() {
		return this.products.reduce((sum, next) => sum + next.price, 0);
	}
	
	addToBasket(product: IProduct) {
		product.inBasket = true;
		this.products.push(product);
		this.total = this.getTotalBasketPrice();
	}

	removeFromBasket(product: IProduct) {
		product.inBasket = false;
		this.products = this.products.filter((item) => item.id !== product.id);
		this.total = this.getTotalBasketPrice();
	}

	clearBasket() {
		this.products = [];
		this.total = this.getTotalBasketPrice();
	}
}