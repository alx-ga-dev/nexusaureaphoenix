
export type LocalizedString = Record<string, string>;

export type User = {
  id: string;
  name: string;
  type: 'Blue' | 'Pink' | 'Black';
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

export type OperationStatus = 'Pending' | 'Completed' | 'Canceled';
export type TransactionType =  'gift' | 'send';

export type Transaction = {
  id: string;
  giftId: string;
  fromUserId: string;
  toUserId: string;
  participants: string[]; // for querying
  type: TransactionType;
  acceptedStatus: OperationStatus;
  paymentStatus: OperationStatus;
  deliveryStatus: OperationStatus;
  date: string;
};
