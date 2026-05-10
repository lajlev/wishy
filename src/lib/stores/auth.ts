import { writable, derived } from 'svelte/store';
import { onAuthStateChanged, signOut as firebaseSignOut, type User, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '$lib/firebase';
import type { UserProfile } from '$lib/types';

const userStore = writable<User | null | undefined>(undefined);
const userProfileStore = writable<UserProfile | null>(null);

let initialized = false;

export function initAuth() {
	if (initialized) return;
	initialized = true;

	setPersistence(auth, browserLocalPersistence);

	onAuthStateChanged(auth, async (firebaseUser) => {
		userStore.set(firebaseUser);
		if (firebaseUser) {
			const userRef = doc(db, 'users', firebaseUser.uid);
			const snap = await getDoc(userRef);
			if (!snap.exists()) {
				await setDoc(userRef, {
					email: firebaseUser.email || '',
					displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || null,
					locale: 'da',
					role: 'user',
					createdAt: serverTimestamp()
				} satisfies Omit<UserProfile, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> });
				userProfileStore.set({ email: firebaseUser.email!, displayName: null, locale: 'da', role: 'user' } as UserProfile);
			} else {
				userProfileStore.set(snap.data() as UserProfile);
			}
		} else {
			userProfileStore.set(null);
		}
	});
}

export const user = { subscribe: userStore.subscribe };
export const userProfile = { subscribe: userProfileStore.subscribe };

export const isLoading = derived(userStore, ($user) => $user === undefined);
export const isLoggedIn = derived(userStore, ($user) => $user !== null && $user !== undefined);
export const isAdmin = derived(userProfileStore, ($profile) => $profile?.role === 'admin');
export const hasUsername = derived(userProfileStore, ($profile) => !!$profile?.username);

export async function checkUsernameAvailable(username: string): Promise<boolean> {
	const snap = await getDoc(doc(db, 'usernames', username));
	return !snap.exists();
}

export async function claimUsername(username: string): Promise<void> {
	const currentUser = auth.currentUser;
	if (!currentUser) throw new Error('Not authenticated');

	await setDoc(doc(db, 'usernames', username), {
		userId: currentUser.uid,
		displayName: currentUser.displayName || currentUser.email?.split('@')[0] || '',
	});
	await updateDoc(doc(db, 'users', currentUser.uid), { username });

	userProfileStore.update((p) => p ? { ...p, username } : p);
}

export async function uploadPhoto(file: File): Promise<string> {
	const currentUser = auth.currentUser;
	if (!currentUser) throw new Error('Not authenticated');

	const storageRef = ref(storage, `avatars/${currentUser.uid}`);
	await uploadBytes(storageRef, file);
	const url = await getDownloadURL(storageRef);

	await updateDoc(doc(db, 'users', currentUser.uid), { photoUrl: url });

	let profile: UserProfile | null = null;
	userProfileStore.update((p) => { profile = p; return p ? { ...p, photoUrl: url } : p; });

	if (profile && (profile as UserProfile).username) {
		await updateDoc(doc(db, 'usernames', (profile as UserProfile).username!), { photoUrl: url });
	}

	return url;
}

export async function generateApiKey(): Promise<string> {
	const currentUser = auth.currentUser;
	if (!currentUser) throw new Error('Not authenticated');

	const { nanoid } = await import('nanoid');
	const key = nanoid(32);

	await updateDoc(doc(db, 'users', currentUser.uid), { apiKey: key });
	userProfileStore.update((p) => p ? { ...p, apiKey: key } : p);

	return key;
}

export async function signOut() {
	await firebaseSignOut(auth);
}
