import './scss/styles.scss';

import { EventEmitter } from './components/base/EventEmitter';
import { Catalog } from './components/model/Catalog';
import { Page } from './components/view/Page';
import { IOrder, IProduct, PaymentMethods } from './types';
import { API_URL } from './utils/constants';
import { cloneTemplate, ensureElement } from './utils/utils';
import { Card } from './components/view/Card';
import { ApiResponse } from './types/base/Api';
import { Modal } from './components/view/Modal';
import { BasketModel } from './components/model/BasketModel';
import { Basket } from './components/view/Basket';
import { DeliveryDetails } from './components/view/DeliveryDetails';
import { Order } from './components/model/Order';
import { Contacts } from './components/view/Contacts';
import { Success } from './components/view/Success';
import { Api } from './components/base/Api';

const api = new Api(API_URL);
const events = new EventEmitter();

// темплейты
const catalogItemTemplate = ensureElement<HTMLTemplateElement>('#card-catalog');
const productPreviewTemplate =
	ensureElement<HTMLTemplateElement>('#card-preview');
const basketTemplate = ensureElement<HTMLTemplateElement>('#basket');
const basketItemTemplate = ensureElement<HTMLTemplateElement>('#card-basket');
const modalTemplate = ensureElement<HTMLElement>('#modal-container');
const deliveryDetailsTemplate = ensureElement<HTMLTemplateElement>('#order');
const contactsTemplate = ensureElement<HTMLTemplateElement>('#contacts');
const successTemplate = ensureElement<HTMLTemplateElement>('#success');

// модели данных
const catalog = new Catalog([], events);
const basketModel = new BasketModel({}, events);
const order = new Order({}, events);

// отоюражения
const page = new Page(document.body, events);
const modal = new Modal(modalTemplate, events);
const basket = new Basket('basket', cloneTemplate(basketTemplate), events);
const deliveryDetails = new DeliveryDetails(
	cloneTemplate(deliveryDetailsTemplate),
	events
);
const contacts = new Contacts(cloneTemplate(contactsTemplate), events);
const success = new Success('order-success', cloneTemplate(successTemplate), {
	onClick: () => events.emit('success:close'),
});

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
events.on('catalog:selectCard', (item: IProduct) => {
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
events.on('modal:toBasket', (item: IProduct) => {
	//если в модели корзины уже содержится товар, то удаляем; в обратном случае - добавляем
	basketModel.products.some((product) => product.id === item.id)
		? basketModel.removeFromBasket(item)
		: basketModel.addToBasket(item);
	//и меняем счетчик товаров в корзине
	page.counter = basketModel.products.length;
	getBasketItemsView();
});

// получить актуальные отображения товаров, добавленных в корзину
function getBasketItemsView() {
	// берем товары из модели корзины, инстанцируем для них карточки, рендерим и сохраняем в товары вьюшки корзины
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
	console.log(basket.items);
	modal.render({
		content: basket.render(basketModel),
	});
});

// удалить из корзины (находясь в корзине)
events.on('basket:delete', (itemToDelete: IProduct) => {
	//удаляем сначала из модели
	basketModel.removeFromBasket(itemToDelete);
	//переопределяем сумму корзины и счетчик на странице
	basket.total = basketModel.total;
	page.counter = basketModel.products.length;
	//перерисовываем список товаров
	getBasketItemsView();
});

// перейти к оформлению заказа
events.on('basket:order', () => {
	//сохраняем в модель заказа актуальные товары и сумму из модели корзины
	order.items = basketModel.products.map((item) => item.id);
	order.total = basketModel.total;
	modal.render({
		content: deliveryDetails.render(order), //рендерим модалку с формой заполнения деталей доставки
	});
});

//меняются данные об оплате
events.on(
	'payment:change',
	(data: { field: keyof IOrder; value: PaymentMethods }) => {
		//сохраняем в модель заказа тип оплаты
		order.payment = data.value;
		order.validateDeliveryDetails();
	}
);

// меняются данные об адресе
events.on('address:change', (data: { field: keyof IOrder; value: string }) => {
	//сохраняем в модель заказа адрес
	order.address = data.value;
	order.validateDeliveryDetails();
});

// изменилось состояние валидации данных с деталями доставки
events.on('deliveryDetailsErrors:change', (errors: Partial<IOrder>) => {
	deliveryDetails.valid = !Object.keys(errors).length; //проверяем, есть ли что нибудь в объекте ошибок
	const errorString = Object.values(errors).join(' и ');
	deliveryDetails.errors =
		errorString.charAt(0).toUpperCase() + errorString.slice(1); //делаем ошибки валидации красивыми
});

// перейти к заполнению контактов
events.on('order:submit', () => {
	modal.render({
		content: contacts.render(order),
	});
});

//меняются данные о почте
events.on(
	'email:change',
	(data: { field: keyof IOrder; value: PaymentMethods }) => {
		//сохраняем в модель заказа тип оплаты
		order.email = data.value;
		order.validateContacts();
	}
);

// меняются данные о телефоне
events.on('phone:change', (data: { field: keyof IOrder; value: string }) => {
	//сохраняем в модель заказа адрес
	order.phone = data.value;
	order.validateContacts();
});

// изменилось состояние валидации данных с контактами
events.on('contactsErrors:change', (errors: Partial<IOrder>) => {
	contacts.valid = !Object.keys(errors).length; //проверяем, есть ли что нибудь в объекте ошибок
	console.log(!Object.keys(errors).length);
	const errorString = Object.values(errors).join(' и ');
	contacts.errors = errorString.charAt(0).toUpperCase() + errorString.slice(1); //делаем ошибки валидации красивыми
});

// отправить на сервер данные и показать окно успешной покупки
events.on('contacts:submit', () => {
	api
		.post('/order', order)
		.then((res) => {
			modal.render({
				content: success.render({
					total: order.total,
				}),
			});
			order.removeOrderData();
			basketModel.clearBasket();
			basket.items = [];
			catalog.products.map((item) => (item.inBasket = false));
			page.counter = basketModel.products.length;
		})
		.catch((err) => {
			console.log(err);
		});
});

events.on('success:close', () => {
	modal.close();
});
