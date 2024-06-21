import './scss/styles.scss';

import { Api } from './components/base/Api';
import { EventEmitter } from './components/base/EventEmitter';
import { Catalog } from './components/model/Catalog';
import { Page } from './components/view/Page';
import { IOrder, IProduct, PaymentMethods } from './types';
import { API_URL } from './utils/constants';
import { cloneTemplate, ensureElement } from './utils/utils';
import { Card } from './components/view/Card';
import { Product } from './components/model/Product';
import { ApiResponse } from './types/base/Api';
import { Modal } from './components/view/Modal';
import { BasketModel } from './components/model/BasketModel';
import { Basket } from './components/view/Basket';
import { DeliveryDetails } from './components/view/DeliveryDetails';
import { Order } from './components/model/Order';

const api = new Api(API_URL);
const events = new EventEmitter();

// темплейты
const catalogItemTemplate = ensureElement<HTMLTemplateElement>('#card-catalog');
const productPreviewTemplate =
	ensureElement<HTMLTemplateElement>('#card-preview');
const basketTemplate = ensureElement<HTMLTemplateElement>('#basket');
const basketItemTemplate = ensureElement<HTMLTemplateElement>('#card-basket');
const modalTemplate = ensureElement<HTMLElement>('#modal-container');
const orderTemplate = ensureElement<HTMLTemplateElement>('#order');

// модели данных
const catalog = new Catalog([], events);
const basketModel = new BasketModel({}, events);
const order = new Order({}, events);

// дом элементы
const page = new Page(document.body, events);
const modal = new Modal(modalTemplate, events);
const basket = new Basket('basket', cloneTemplate(basketTemplate), events);
const deliveryDetails = new DeliveryDetails(
	cloneTemplate(orderTemplate),
	events
);

// получаем товары и сохраняем в модель каталога
api
	.get('/product')
	.then((res: ApiResponse) => {
		catalog.setProducts(res.items as IProduct[]);
	})
	.catch((err) => {
		console.error(err);
	});

// отображаем товары в каталоге
events.on('items:changed', () => {
	//для каждого продукта в модели каталога инстанцируем и рендерим карточку
	page.catalog = catalog.products.map((item) => {
		const catalogItem = new Card('card', cloneTemplate(catalogItemTemplate), {
			onClick: () => events.emit('catalog:selectCard', item), // создаем действие открытия карточки из каталога
		});
		return catalogItem.render(item);
	});
});

// открыть карточку
events.on('catalog:selectCard', (item: Product) => {
	//для того товара, на который нажали, создаем карточку
	const productPreview = new Card(
		'card',
		cloneTemplate(productPreviewTemplate),
		{
			onClick: () => {
				events.emit('modal:toBasket', item); //создаем действие добавления в корзину из карточки товара
				productPreview.switchButtonText(item); //и меняем текст кнопки "в корзину" при нажатии
			},
		}
	);
	productPreview.switchButtonText(item); //здесь меняем текст кнопки в отображении, когда карточку закрыли и повторно открыли
	//рисуем модалку и внутри рисуем карточку
	modal.render({
		content: productPreview.render(item),
	});
});

// Блокируем прокрутку страницы если открыта модалка
events.on('modal:open', () => {
	page.locked = true;
});

// ... и разблокируем
events.on('modal:close', () => {
	page.locked = false;
});

// добавить/удалить из корзины (из карточки товара)
events.on('modal:toBasket', (item: Product) => {
	//если в модели корзины уже содержится товар, то удаляем; в обратном случае - добавляем
	basketModel.products.some((product) => product.id === item.id)
		? basketModel.removeFromBasket(item)
		: basketModel.addToBasket(item);
	//и меняем счетчик товаров в корзине
	page.counter = basketModel.products.length;
});

// получить актуальные отображения товаров, добавленных в корзину
function getBasketItemsView() {
	//берем товары из модели корзины, инстанцируем для них карточки, рендерим и сохраняем в товары вьюшки корзины
	basket.items = basketModel.products.map((item, index) => {
		const basketItem = new Card('card', cloneTemplate(basketItemTemplate), {
			onClick: () => {
				events.emit('basket:delete', item); //обозначаем, что тут можно будет удалять товар из корзины
			},
		});
		basketItem.basketIndex = index + 1; //записываем индекс товара чтобы отображать нумерованный список
		return basketItem.render(item);
	});
}

// открыть корзину
events.on('basket:open', () => {
	//рендерим модалку с актуальными товарами корзины
	getBasketItemsView();
	modal.render({
		content: basket.render(basketModel),
	});
});

// удалить из корзины (находясь в корзине)
events.on('basket:delete', (itemToDelete: Product) => {
	//удаляем сначала из модели
	basketModel.removeFromBasket(itemToDelete);
	basket.total = basketModel.total;
	page.counter = basketModel.products.length;
	//переопределяем сумму корзины и счетчик на странице
	getBasketItemsView();
	//перерисовываем список товаров
});

// оформить заказ
events.on('basket:order', () => {
	order.products = basketModel.products;
	order.total = basketModel.total;
	//сохраняем в модель заказа актуальные товары и сумму из модели корзины
	modal.render({
		content: deliveryDetails.render({
			address: '',
			valid: false,
			errors: [],
		}), //рендерим модалку с формой заполнения деталей доставки
	});
});

//меняются данные об оплате
events.on(
	'payment:change',
	(data: { field: keyof IOrder; value: PaymentMethods }) => {
		order.payment = data.value;
		order.validateDeliveryDetails();
	}
);

// меняются данные об адресе
events.on('address:change', (data: { field: keyof IOrder; value: string }) => {
	order.address = data.value;
	order.validateDeliveryDetails();
});

// изменилось состояние валидации данных с деталями доставки
events.on('deliveryDetailsErrors:change', (errors: Partial<IOrder>) => {
	deliveryDetails.valid = !Object.keys(errors).length; //проверяем, есть ли что нибудь в объекте ошибок
	const errorString = Object.values(errors).join(' и ');
	deliveryDetails.errors =
		errorString.charAt(0).toUpperCase() + errorString.slice(1); //делаем ошибки валидации красивыми
	console.log(typeof Object.values(errors).join(' и '));
});
