<script lang="ts">
	import { t } from '$lib/i18n';
	import type { WishItem, Reservation } from '$lib/types';

	let {
		item,
		reservation = null,
		isOwner = false,
		isShared = false,
		currentUserId = '',
		ondelete,
		onedit,
		onreserve,
		onunreserve
	}: {
		item: WishItem;
		reservation?: Reservation | null;
		isOwner?: boolean;
		isShared?: boolean;
		currentUserId?: string;
		ondelete?: () => void;
		onedit?: () => void;
		onreserve?: () => void;
		onunreserve?: () => void;
	} = $props();

	const isReservedByMe = $derived(reservation?.reservedBy === currentUserId);
	const isReservedByOther = $derived(reservation !== null && !isReservedByMe);
</script>

<div
	class="bg-card rounded-2xl border-2 p-4 flex gap-4 transition-all duration-200 hover:shadow-md {isReservedByOther ? 'opacity-50 border-text-muted/20' : 'border-primary-light/30 hover:border-primary/30 hover:shadow-primary/5'}"
>
	{#if item.imageUrl}
		<img
			src={item.imageUrl}
			alt={item.name}
			class="w-20 h-20 object-cover rounded-xl flex-shrink-0 border-2 border-primary-light/20"
		/>
	{/if}

	<div class="flex-1 min-w-0">
		<div class="flex items-start justify-between gap-2">
			<div>
				<h4 class="font-bold text-text">{item.name}</h4>
				{#if item.price}
					<p class="text-sm text-primary font-bold mt-0.5">
						{item.price} {item.currency || 'DKK'}
					</p>
				{/if}
			</div>
		</div>

		{#if item.notes}
			<p class="text-sm text-text-soft mt-1">{item.notes}</p>
		{/if}

		{#if item.url}
			<a
				href={item.url}
				target="_blank"
				rel="noopener noreferrer"
				class="text-xs text-secondary font-semibold hover:text-secondary-dark hover:underline mt-1 inline-block"
			>
				🔗 {new URL(item.url).hostname}
			</a>
		{/if}

		<div class="flex items-center gap-2 mt-3">
			{#if isOwner}
				<button
					onclick={onedit}
					class="text-xs font-semibold text-text-soft hover:text-primary px-3 py-1.5 rounded-full border-2 border-primary-light/30 hover:border-primary/50 hover:bg-primary-light/10 transition-all active:scale-95"
				>
					{$t('item.edit')}
				</button>
				<button
					onclick={ondelete}
					class="text-xs font-semibold text-danger hover:text-red-600 px-3 py-1.5 rounded-full border-2 border-danger/30 hover:border-danger/50 hover:bg-red-50 transition-all active:scale-95"
				>
					{$t('item.delete')}
				</button>
			{/if}

			{#if isShared && !isOwner}
				{#if isReservedByMe}
					<button
						onclick={onunreserve}
						class="text-xs font-bold bg-gradient-to-r from-primary to-primary-dark text-white px-4 py-1.5 rounded-full hover:shadow-md hover:shadow-primary/20 transition-all active:scale-95"
					>
						{$t('shared.unreserve')}
					</button>
					<span class="text-xs font-semibold text-primary">✨ {$t('shared.reservedByYou')}</span>
				{:else if isReservedByOther}
					<span class="text-xs font-semibold text-text-muted">🎀 {$t('shared.reservedByOther')}</span>
				{:else}
					<button
						onclick={onreserve}
						class="text-xs font-bold bg-gradient-to-r from-success to-emerald-500 text-white px-4 py-1.5 rounded-full hover:shadow-md hover:shadow-success/20 transition-all active:scale-95"
					>
						🎁 {$t('shared.reserve')}
					</button>
				{/if}
			{/if}
		</div>
	</div>
</div>
