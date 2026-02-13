
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
