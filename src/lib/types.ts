
export type LocalizedString = Record<string, string>;

export type User = {
  id: string;
  name: string;
  type: 'Blue' | 'Pink';
  roleLevel: number;
  wishlist?: string[];
};

export type Collection = {
  id: string;
  name: LocalizedString;
};

export type Rarity = {
  id: string;
  name: LocalizedString;
  color: string;
};

export type Gift = {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  collection: string;
  collectionId: string; 
  rarity: string;
  rarityId: string; 
  price: number;
  isHidden: boolean;
  isTradeable: boolean;
  imageUrl: string;
  imageHint: string;
};

export type DeliveryStatus = 'Pending' | 'Delivered' | 'Canceled';
export type SettlementStatus = 'Unpaid' | 'Paid' | 'Canceled';
export type TransactionType = 'exchange' | 'gift' | 'send';

export type Transaction = {
  id: string;
  giftId: string;
  fromUserId: string;
  toUserId: string;
  participants: string[]; // for querying
  date: string;
  deliveryStatus: DeliveryStatus;
  settlementStatus: SettlementStatus;
  type: TransactionType;
};