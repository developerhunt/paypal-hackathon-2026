export interface ProductOffer {
  offerId: string;
  merchantId: string;
  merchantName: string;
  merchantRating: number;
  price: number;
  originalPrice?: number;
  currency: string;
  inStock: boolean;
  shippingCost: number;
  deliveryDays: number;
  checkoutUrl?: string;
}

export interface ProductItem {
  id: string;
  title: string;
  description: string;
  brand: string;
  category: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  offers: ProductOffer[];
  isPoisoned?: boolean; // For prompt injection attack testing
  injectionPayload?: string;
}

export interface SearchQuery {
  query: string;
  category?: string;
  maxPrice?: number;
  minRating?: number;
}
