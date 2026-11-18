import { collection, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '$lib/firebase';
import type { Friend } from '$lib/types';

export type FriendEntry = Friend & { uid: string };

export function listenToFriends(uid: string, cb: (friends: FriendEntry[]) => void): () => void {
	const q = query(collection(db, 'users', uid, 'friends'), orderBy('since', 'desc'));
	return onSnapshot(q, (snap) => {
		cb(snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as FriendEntry));
	}, () => cb([]));
}

export async function isFriendWith(myUid: string, otherUid: string): Promise<boolean> {
	const snap = await getDoc(doc(db, 'users', myUid, 'friends', otherUid));
	return snap.exists();
}

export async function addFriend(username: string): Promise<{ friendUid: string; alreadyFriends: boolean }> {
	const fn = httpsCallable<{ username: string }, { friendUid: string; alreadyFriends: boolean }>(functions, 'addFriend');
	const res = await fn({ username });
	return res.data;
}

export async function removeFriend(friendUid: string): Promise<void> {
	const fn = httpsCallable(functions, 'removeFriend');
	await fn({ friendUid });
}

export async function sendListInvite(email: string, locale: string): Promise<void> {
	const fn = httpsCallable(functions, 'sendListInvite');
	await fn({ email, locale, baseUrl: window.location.origin });
}

/** Public link to a list that tells the recipient it was shared with them. */
export function shareUrl(username: string): string {
	return `${window.location.origin}/lists/${username}?invite=1`;
}
