import { CategoryType, IProduct } from "../../types";
import { Model } from "../base/Model";

export class Product extends Model<IProduct> implements IProduct {
	id: string;
	description: string;
	image: string;
	title: string;
	category: CategoryType;
	price: number | null;
	inBasket: boolean = false;
}
