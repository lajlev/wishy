import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
	email: string;
	displayName: string | null;
	username?: string;
	photoUrl?: string | null;
	apiKey?: string;
	locale: 'da' | 'en';
	role?: 'admin' | 'user';
	banned?: boolean;
	createdAt: Timestamp;
}

export interface PublicProfile {
	userId: string;
	displayName?: string;
	photoUrl?: string;
}

export interface Wishlist {
	id: string;
	ownerId: string;
	title: string;
	description: string | null;
	shareToken: string;
	createdAt: Timestamp;
	updatedAt: Timestamp;
}

export interface WishItem {
	id: string;
	name: string;
	url: string | null;
	price: number | null;
	currency: string | null;
	imageUrl: string | null;
	notes: string | null;
	order: number;
	createdAt: Timestamp;
}

export interface Reservation {
	reservedBy: string;
	reservedByName: string;
	reservedAt: Timestamp;
}

export interface ScrapedData {
	name: string | null;
	description: string | null;
	imageUrl: string | null;
	price: string | null;
	siteName: string | null;
}
