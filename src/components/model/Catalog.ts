import { IProduct } from '../../types';
import { Model } from '../base/Model';
import { Product } from './Product';

export class Catalog extends Model<IProduct[]> {
	products: Product[];

	setProducts(items: IProduct[]) {
		this.products = items.map((item) => new Product(item, this.events));
		this.emitChanges('items:changed', { products: this.products });
	}
}
