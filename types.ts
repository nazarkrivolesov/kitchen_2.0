
export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  ingredients: string[];
  createdAt?: any;
}

export interface CartItem extends Dish {
  quantity: number;
}

export type Category = 'Перші страви' | 'Основні страви' | 'Закуски' | 'Десерти';

export type OrderStatus = 'new' | 'cooking' | 'delivery' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    comment: string;
  };
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: any;
}
