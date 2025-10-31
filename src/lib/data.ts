import type { User, Gift, Collection, Rarity, Transaction, Exchange } from './types';
import { PlaceHolderImages } from './placeholder-images';
import { DEFAULT_USER_ID } from './constants';

const getImage = (id: string) => PlaceHolderImages.find(img => img.id === id) || PlaceHolderImages[0];

export const users: User[] = [
    { id: DEFAULT_USER_ID, name: 'Admin User', type: 'Blue', roleLevel: 2 },
    { id: 'user-1', name: 'Alex', type: 'Blue', roleLevel: 2 },
    { id: 'user-2', name: 'Barbara', type: 'Pink', roleLevel: 0 },
    { id: 'user-3', name: 'Charlie', type: 'Blue', roleLevel: 0 },
    { id: 'user-4', name: 'Diana', type: 'Pink', roleLevel: 0 },
    { id: 'user-5', name: 'Benjamin', type: 'Black', roleLevel: 1 },
];

export const collections: Collection[] = [
    { id: 'col-1', name: { en: 'Cosmic Wonders', es: 'Maravillas Cósmicas' } },
    { id: 'col-2', name: { en: 'Gallery of Dreams', es: 'Galería de Sueños' } },
    { id: 'col-3', name: { en: 'Ancient Treasures', es: 'Tesoros Antiguos' } },
    { id: 'col-4', name: { en: 'Explorer\'s Gear', es: 'Equipo de Explorador' } },
];

export const rarities: Rarity[] = [
    { id: 'rar-1', name: { en: 'Common', es: 'Común' }, color: '#9CA3AF' },
    { id: 'rar-2', name: { en: 'Uncommon', es: 'Poco Común' }, color: '#4ADE80' },
    { id: 'rar-3', name: { en: 'Rare', es: 'Raro' }, color: '#60A5FA' },
    { id: 'rar-4', name: { en: 'Epic', es: 'Épico' }, color: '#A78BFA' },
    { id: 'rar-5', name: { en: 'Legendary', es: 'Legendario' }, color: '#FBBF24' },
];

export const gifts: Gift[] = [
    { 
        id: 'cosmic-keychain', 
        name: { en: 'Cosmic Keychain', es: 'Llavero Cósmico' }, 
        description: { en: 'A keychain that glows in the dark.', es: 'Un llavero que brilla en la oscuridad.' }, 
        collection: 'Cosmic Wonders', 
        collectionId: 'col-1', 
        rarity: 'Rare', 
        rarityId: 'rar-3', 
        price: 10, 
        isHidden: false, 
        isTradeable: true, 
        imageUrl: getImage('gift-common-1').imageUrl, 
        imageHint: getImage('gift-common-1').imageHint    
    },
    { 
        id: 'sticker-pack', 
        name: { en: 'Sticker Pack', es: 'Paquete de Pegatinas' }, 
        description: { en: 'A pack of assorted stickers.', es: 'Un paquete de pegatinas surtidas.' }, 
        collection: 'Cosmic Wonders', 
        collectionId: 'col-1', 
        rarity: 'Common', 
        rarityId: 'rar-1', 
        price: 5, 
        isHidden: false, 
        isTradeable: true, 
        imageUrl: getImage('gift-common-2').imageUrl, 
        imageHint: getImage('gift-common-2').imageHint
    },
    { 
        id: 'nebula-pin', 
        name: { en: 'Nebula Enamel Pin', es: 'Pin Esmaltado de Nebula' }, 
        description: { en: 'Beautiful Nebula Enamel Pin.', es: 'Un bello pin esmaltado de Nebula.' }, 
        collection: 'Gallery of Dreams', 
        collectionId: 'col-2', 
        rarity: 'Uncommon', 
        rarityId: 'rar-2', 
        price: 15, 
        isHidden: false, 
        isTradeable: true, 
        imageUrl: getImage('gift-uncommon-1').imageUrl, 
        imageHint: getImage('gift-uncommon-1').imageHint
    },
    { 
        id: 'starlight-print', 
        name: { en: '"Starlight" Art Print', es: 'Impresion de Arte "Starlight"' },
        description: { en: 'A high-quality art print.', es: 'Una impresion de arte de alta calidad.' }, 
        collection: 'Gallery of Dreams', 
        collectionId: 'col-2', 
        rarity: 'Uncommon', 
        rarityId: 'rar-2', 
        price: 15, 
        isHidden: false, 
        isTradeable: true, 
        imageUrl: getImage('gift-uncommon-2').imageUrl, 
        imageHint: getImage('gift-uncommon-2').imageHint
    },
    { 
        id: 'orions-belt', 
        name: { en: 'Orion\'s Belt Coin', es: 'Moneda de la Osa Mayor' }, 
        description: { en: 'A limited edition collectible coin.', es: 'Moneda de colección de edición limitada.' }, 
        collection: 'Ancient Treasures', 
        collectionId: 'col-3', 
        rarity: 'Rare', 
        rarityId: 'rar-3', 
        price: 15, 
        isHidden: false, 
        isTradeable: true, 
        imageUrl: getImage('gift-rare-1').imageUrl, 
        imageHint: getImage('gift-rare-1').imageHint
    },
    { 
        id: 'constellation-mug', 
        name: { en: 'Constellation Mug', es: 'Taza Constelación' }, 
        description: { en: 'A designer coffee mug.', es: 'Taza para café de diseñador.' }, 
        collection: 'Cosmic Wonders', 
        collectionId: 'col-1', 
        rarity: 'Rare', 
        rarityId: 'rar-3', 
        price: 15, 
        isHidden: false, 
        isTradeable: true, 
        imageUrl: getImage('gift-rare-2').imageUrl, 
        imageHint: getImage('gift-rare-2').imageHint
    },
    { 
        id: 'captains-log', 
        name: { en: 'Captain\'s Log Journal', es: 'Diario del Capitán' }, 
        description: { en: 'A hand-crafted leather journal.', es: 'Un diario encuadernado en piel artesanalmente.' }, 
        collection: 'Explorer\'s Gear', 
        collectionId: 'col-4', 
        rarity: 'Epic', 
        rarityId: 'rar-4', 
        price: 15, 
        isHidden: false, 
        isTradeable: true, 
        imageUrl: getImage('gift-epic-1').imageUrl, 
        imageHint: getImage('gift-epic-1').imageHint
    },
    { 
        id: 'zerog-earbuds', 
        name: { en: 'Zero-G Earbuds', es: 'Audífonos Zero-G' }, 
        description: { en: 'Wireless earbuds.', es: 'Audífonos Inalámbricos.' }, 
        collection: 'Explorer\'s Gear', 
        collectionId: 'col-4', 
        rarity: 'Epic', 
        rarityId: 'rar-4', 
        price: 25, 
        isHidden: false, 
        isTradeable: true, 
        imageUrl: getImage('gift-epic-2').imageUrl, 
        imageHint: getImage('gift-epic-2').imageHint 
    },
    { 
        id: 'signed-celestial-poster', 
        name: { en: 'Signed "Celestial" Poster', es: 'Poster "Celestial" firmado' }, 
        description: { en: 'A rare signed poster from a famous artist.', es: 'Un raro poster firmado por un famoso artista.' }, 
        collection: 'Gallery of Dreams', 
        collectionId: 'col-2', 
        rarity: 'Legendary', 
        rarityId: 'rar-5', 
        price: 50, 
        isHidden: true, 
        isTradeable: false, 
        imageUrl: getImage('gift-legendary-1').imageUrl, 
        imageHint: getImage('gift-legendary-1').imageHint
    },
    { 
        id: 'astro-mechanical-watch', 
        name: { en: 'Astro-Mechanical Watch', es: 'Reloj Astro-Mecánico' }, 
        description: { en: 'A vintage mechanical watch.', es: 'Un reloj mecánico antiguo.' }, 
        collection: 'Ancient Treasures', 
        collectionId: 'col-3', 
        rarity: 'Legendary', 
        rarityId: 'rar-5', 
        price: 50, 
        isHidden: true, 
        isTradeable: false, 
        imageUrl: getImage('gift-legendary-2').imageUrl, 
        imageHint: getImage('gift-legendary-2').imageHint
    },
];

export const transactions: Transaction[] = [
    { id: 'exc-1', userId: 'user-1', process: "Payment", txStatus: 'Completed' },
    { id: 'exc-2', userId: 'user-2', process: "Delivery", txStatus:  'Pending' },
    { id: 'exc-3', userId: 'user-3', process: "Payment", txStatus: 'Pending' },
    { id: 'exc-4', userId: 'user-4', process: "Delivery", txStatus:  'Pending' },
    { id: 'exc-5', userId: 'user-3', process: "Payment", txStatus: 'Pending' },
    { id: 'exc-6', userId: 'user-2', process: "Delivery", txStatus:  'Pending' },
    { id: 'exc-7', userId: 'user-1', process: "Payment", txStatus: 'Pending' },
    { id: 'exc-8', userId: 'user-4', process: "Delivery", txStatus:  'Pending' },
    { id: 'exc-9', userId: 'user-1', process: "Payment", txStatus: 'Pending' },
    { id: 'exc-10', userId: 'user-2', process: "Delivery", txStatus:  'Pending' },
    { id: 'exc-11', userId: 'user-3', process: "Payment", txStatus: 'Pending' },
    { id: 'exc-12', userId: 'user-4', process: "Delivery", txStatus:  'Pending' },
];
  
export const exchanges: Exchange[] = [
    { id: 'txn-1', giftId: 'cosmic-keychain', fromTxId: 'exc-1', toTxId: 'exc-2', participants: ['user-1', 'user-2'], date: '2023-10-01', exchStatus: 'Completed', type: 'gift' },
    { id: 'txn-2', giftId: 'nebula-pin', fromTxId: 'exc-3', toTxId: 'exc-4', participants: ['user-3', 'user-4'], date: '2023-10-02', exchStatus: 'Pending', type: 'send' },
    { id: 'txn-3', giftId: 'orions-belt', fromTxId: 'exc-5', toTxId: 'exc-6', participants: ['user-3', 'user-2'], date: '2023-10-03', exchStatus: 'Completed', type: 'gift' },
    { id: 'txn-4', giftId: 'captains-log', fromTxId: 'exc-7', toTxId: 'exc-8', participants: ['user-1', 'user-4'], date: '2023-10-04', exchStatus: 'Completed', type: 'gift' },
    { id: 'txn-5', giftId: 'sticker-pack', fromTxId: 'exc-9', toTxId: 'exc-10', participants: ['user-1', 'user-2'], date: '2023-10-05', exchStatus: 'Canceled', type: 'gift' },
    { id: 'txn-6', giftId: 'starlight-print', fromTxId: 'exc-11', toTxId: 'exc-12', participants: ['user-3', 'user-4'], date: '2023-10-06', exchStatus: 'Completed', type: 'send' },
];
  
// This data is now primarily for local reference and will be replaced by Firestore data in the UI.
export const wishList: { userId: string, giftIds: string[] }[] = [
    { userId: 'user-2', giftIds: ['cosmic-keychain', 'sticker-pack'] },
    { userId: 'user-4', giftIds: ['signed-celestial-poster', 'astro-mechanical-watch'] }
];
  