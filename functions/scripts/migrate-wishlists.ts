/**
 * One-time migration: moves wishlists from top-level `wishlists/{id}` to
 * `users/{ownerId}/wishlists/{id}`, including items and reservations subcollections.
 *
 * Usage:
 *   npx ts-node scripts/migrate-wishlists.ts
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS pointing at a service account JSON,
 * or run from a machine with Application Default Credentials that has Firestore access.
 */

import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

async function migrate() {
	const wishlistsSnap = await db.collection('wishlists').get();
	console.log(`Found ${wishlistsSnap.size} wishlists to migrate`);

	for (const wDoc of wishlistsSnap.docs) {
		const data = wDoc.data();
		const ownerId = data.ownerId;

		if (!ownerId) {
			console.warn(`Skipping wishlist ${wDoc.id} — no ownerId`);
			continue;
		}

		const newWishlistRef = db.doc(`users/${ownerId}/wishlists/${wDoc.id}`);

		const { ownerId: _, ...wishlistData } = data;

		const batch = db.batch();
		batch.set(newWishlistRef, wishlistData);

		const itemsSnap = await db.collection(`wishlists/${wDoc.id}/items`).get();
		for (const itemDoc of itemsSnap.docs) {
			batch.set(
				db.doc(`users/${ownerId}/wishlists/${wDoc.id}/items/${itemDoc.id}`),
				itemDoc.data()
			);
		}

		const reservationsSnap = await db.collection(`wishlists/${wDoc.id}/reservations`).get();
		for (const resDoc of reservationsSnap.docs) {
			batch.set(
				db.doc(`users/${ownerId}/wishlists/${wDoc.id}/reservations/${resDoc.id}`),
				resDoc.data()
			);
		}

		await batch.commit();
		console.log(`Migrated wishlist ${wDoc.id} (${itemsSnap.size} items, ${reservationsSnap.size} reservations) → users/${ownerId}/wishlists/${wDoc.id}`);
	}

	// Add ownerId to existing unreserveTokens that don't have it
	const unreserveSnap = await db.collection('unreserveTokens').get();
	for (const tokenDoc of unreserveSnap.docs) {
		const tokenData = tokenDoc.data();
		if (tokenData.ownerId) continue;

		const wishlistDoc = await db.doc(`wishlists/${tokenData.wishlistId}`).get();
		if (wishlistDoc.exists) {
			await tokenDoc.ref.update({ ownerId: wishlistDoc.data()!.ownerId });
			console.log(`Updated unreserveToken ${tokenDoc.id} with ownerId`);
		}
	}

	// Add ownerId to existing pendingReservations that don't have it
	const pendingSnap = await db.collection('pendingReservations').get();
	for (const pendingDoc of pendingSnap.docs) {
		const pendingData = pendingDoc.data();
		if (pendingData.ownerId) continue;

		const wishlistDoc = await db.doc(`wishlists/${pendingData.wishlistId}`).get();
		if (wishlistDoc.exists) {
			await pendingDoc.ref.update({ ownerId: wishlistDoc.data()!.ownerId });
			console.log(`Updated pendingReservation ${pendingDoc.id} with ownerId`);
		}
	}

	console.log('\nMigration complete. Verify data, then delete the old top-level wishlists collection manually.');
}

migrate().catch((err) => {
	console.error('Migration failed:', err);
	process.exit(1);
});
