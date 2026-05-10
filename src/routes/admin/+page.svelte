<script lang="ts">
	import { httpsCallable } from 'firebase/functions';
	import { functions } from '$lib/firebase';
	import { isAdmin, isLoggedIn, isLoading } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import type { Timestamp } from 'firebase/firestore';

	interface UserEntry {
		uid: string;
		email: string;
		displayName: string | null;
		role?: string;
		banned?: boolean;
		createdAt: Timestamp;
	}

	let users = $state<UserEntry[]>([]);
	let loading = $state(true);
	let actionLoading = $state('');

	$effect(() => {
		if ($isLoading) return;
		if (!$isLoggedIn || !$isAdmin) {
			goto('/');
			return;
		}
		loadUsers();
	});

	async function loadUsers() {
		loading = true;
		try {
			const listUsers = httpsCallable(functions, 'adminListUsers');
			const result = await listUsers({});
			users = result.data as UserEntry[];
		} catch (e) {
			console.error('Failed to load users', e);
		} finally {
			loading = false;
		}
	}

	async function toggleBan(uid: string, currentlyBanned: boolean) {
		if (!confirm(currentlyBanned ? 'Unban this user?' : 'Ban this user? They will be signed out immediately.')) return;
		actionLoading = uid;
		try {
			const banUser = httpsCallable(functions, 'adminBanUser');
			await banUser({ uid, banned: !currentlyBanned });
			users = users.map(u => u.uid === uid ? { ...u, banned: !currentlyBanned } : u);
		} catch (e) {
			alert('Failed to update user');
		} finally {
			actionLoading = '';
		}
	}

	async function deleteUser(uid: string, email: string) {
		if (!confirm(`Permanently delete ${email}? This will remove all their wishlists and data.`)) return;
		actionLoading = uid;
		try {
			const del = httpsCallable(functions, 'adminDeleteUser');
			await del({ uid });
			users = users.filter(u => u.uid !== uid);
		} catch (e) {
			alert('Failed to delete user');
		} finally {
			actionLoading = '';
		}
	}
</script>

{#if $isAdmin}
<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-extrabold text-text">Admin — Users</h1>
		<span class="text-sm text-text-soft">{users.length} users</span>
	</div>

	{#if loading}
		<div class="flex justify-center py-12">
			<div class="flex gap-1.5">
				<span class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 0s"></span>
				<span class="w-2 h-2 bg-secondary rounded-full animate-bounce" style="animation-delay: 0.15s"></span>
				<span class="w-2 h-2 bg-accent rounded-full animate-bounce" style="animation-delay: 0.3s"></span>
			</div>
		</div>
	{:else}
		<div class="space-y-2">
			{#each users as u (u.uid)}
				<div class="bg-card rounded-xl border-2 border-primary-light/20 p-4 flex items-center justify-between gap-4">
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2">
							<span class="font-bold text-text truncate">{u.email}</span>
							{#if u.role === 'admin'}
								<span class="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">Admin</span>
							{/if}
							{#if u.banned}
								<span class="text-xs bg-danger/10 text-danger font-bold px-2 py-0.5 rounded-full">Banned</span>
							{/if}
						</div>
						<p class="text-xs text-text-muted mt-0.5">
							{u.displayName || '—'} · {u.uid.slice(0, 8)}...
						</p>
					</div>
					{#if u.role !== 'admin'}
						<div class="flex gap-2 shrink-0">
							<button
								onclick={() => toggleBan(u.uid, !!u.banned)}
								disabled={actionLoading === u.uid}
								class="text-xs font-semibold px-3 py-1.5 rounded-lg border-2 transition-all disabled:opacity-50
									{u.banned ? 'border-success/30 text-success hover:bg-success/10' : 'border-warning/30 text-warning hover:bg-warning/10'}"
							>
								{u.banned ? 'Unban' : 'Ban'}
							</button>
							<button
								onclick={() => deleteUser(u.uid, u.email)}
								disabled={actionLoading === u.uid}
								class="text-xs font-semibold px-3 py-1.5 rounded-lg border-2 border-danger/30 text-danger hover:bg-danger/10 transition-all disabled:opacity-50"
							>
								Delete
							</button>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
{/if}
