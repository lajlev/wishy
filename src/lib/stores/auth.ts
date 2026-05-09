import { writable, derived } from 'svelte/store';
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '$lib/firebase';
import type { UserProfile } from '$lib/types';

const userStore = writable<User | null | undefined>(undefined);

let initialized = false;

export function initAuth() {
	if (initialized) return;
	initialized = true;
	onAuthStateChanged(auth, async (firebaseUser) => {
		userStore.set(firebaseUser);
		if (firebaseUser) {
			const userRef = doc(db, 'users', firebaseUser.uid);
			const snap = await getDoc(userRef);
			if (!snap.exists()) {
				await setDoc(userRef, {
					email: firebaseUser.email,
					displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || null,
					locale: 'da',
					createdAt: serverTimestamp()
				} satisfies Omit<UserProfile, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> });
			}
		}
	});
}

export const user = { subscribe: userStore.subscribe };

export const isLoading = derived(userStore, ($user) => $user === undefined);
export const isLoggedIn = derived(userStore, ($user) => $user !== null && $user !== undefined);

export async function signOut() {
	await firebaseSignOut(auth);
}
