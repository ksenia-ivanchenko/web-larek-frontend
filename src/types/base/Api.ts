import { IProduct } from "..";

export type ApiListResponse<Type> = {
	total: number,
	items: Type[]
};

export type ApiPostMethods = 'POST' | 'PUT' | 'DELETE';
export interface ApiResponse {
	items: IProduct[];
}
