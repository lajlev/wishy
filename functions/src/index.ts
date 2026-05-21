import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';
import ogs from 'open-graph-scraper';
import OpenAI from 'openai';
import { randomBytes } from 'crypto';

admin.initializeApp();

const openaiApiKey = defineSecret('OPENAI_API_KEY');
const resendApiKey = defineSecret('RESEND_API_KEY');
const resendFrom = defineSecret('RESEND_FROM');
const turnstileSecret = defineSecret('TURNSTILE_SECRET_KEY');

const ADMIN_EMAIL = 'lajlev@gmail.com';

async function verifyTurnstile(token: string, secret: string): Promise<boolean> {
	if (!secret || token === 'dev-bypass') return true;

	const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
	});
	const data = await res.json() as { success: boolean };
	return data.success;
}

async function requireAdmin(uid: string): Promise<void> {
	const userDoc = await admin.firestore().doc(`users/${uid}`).get();
	if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
		throw new HttpsError('permission-denied', 'Admin access required');
	}
}

const emailStrings: Record<string, Record<string, string>> = {
	da: {
		subject: 'Log ind på Wishy 🎁',
		heading: 'Hej! 👋',
		body: 'Klik på knappen nedenfor for at logge ind på din Wishy-konto.',
		button: '✨ Log ind',
		expiry: 'Linket udløber om 1 time.',
		ignore: 'Hvis du ikke har bedt om dette link, kan du ignorere denne email.',
		tagline: 'Din families ønskeliste',
	},
	en: {
		subject: 'Sign in to Wishy 🎁',
		heading: 'Hey there! 👋',
		body: 'Click the button below to sign in to your Wishy account.',
		button: '✨ Sign in',
		expiry: 'This link expires in 1 hour.',
		ignore: "If you didn't request this, you can safely ignore this email.",
		tagline: 'Your family wishlist',
	},
};

function buildLoginEmail(signInLink: string, locale: string): string {
	const s = emailStrings[locale] || emailStrings['da'];
	return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${s.subject}</title>
<!--[if mso]>
<style>table,td{font-family:Arial,sans-serif!important}</style>
<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#fdf8f4;font-family:'Nunito',system-ui,-apple-system,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf8f4;min-height:100vh;">
<tr><td align="center" style="padding:40px 16px;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;">
<!-- Logo -->
<tr><td align="center" style="padding-bottom:32px;">
	<span style="font-size:48px;line-height:1;">🎁</span>
	<br>
	<span style="font-size:28px;font-weight:800;background:linear-gradient(to right,#e8567f,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Wishy</span>
	<br>
	<span style="font-size:14px;color:#6b5a8a;font-weight:500;">${s.tagline}</span>
</td></tr>

<!-- Card -->
<tr><td>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:20px;border:2px solid rgba(249,168,196,0.3);box-shadow:0 4px 24px rgba(232,86,127,0.08);">
<tr><td style="padding:40px 36px;">

	<!-- Heading -->
	<h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:#2e1065;text-align:center;">${s.heading}</h1>

	<!-- Body text -->
	<p style="margin:0 0 32px;font-size:16px;line-height:1.6;color:#6b5a8a;text-align:center;">${s.body}</p>

	<!-- Button -->
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
	<tr><td align="center">
		<!--[if mso]>
		<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${signInLink}" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="50%" fill="true" stroke="false">
		<v:fill type="gradient" color="#d63d6a" color2="#e8567f" angle="90"/>
		<w:anchorlock/>
		<center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">
		${s.button}
		</center>
		</v:roundrect>
		<![endif]-->
		<!--[if !mso]><!-->
		<a href="${signInLink}" target="_blank" style="display:inline-block;background:linear-gradient(to right,#e8567f,#d63d6a);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 48px;border-radius:50px;box-shadow:0 4px 16px rgba(232,86,127,0.25);">
			${s.button}
		</a>
		<!--<![endif]-->
	</td></tr>
	</table>

	<!-- Expiry notice -->
	<p style="margin:28px 0 0;font-size:13px;line-height:1.5;color:#9b8ab8;text-align:center;">
		${s.expiry}<br>${s.ignore}
	</p>

</td></tr>
</table>
</td></tr>

<!-- Footer -->
<tr><td align="center" style="padding-top:28px;">
	<p style="margin:0;font-size:12px;color:#9b8ab8;">
		Wishy &mdash; ${s.tagline}
	</p>
</td></tr>

</table>

</td></tr>
</table>
</body>
</html>`;
}

export const sendLoginEmail = onCall(
	{ maxInstances: 10, secrets: [resendApiKey, resendFrom, turnstileSecret], cors: true },
	async (request) => {
		const { email, callbackUrl, locale, captchaToken } = request.data;

		if (!email || typeof email !== 'string') {
			throw new HttpsError('invalid-argument', 'Email is required');
		}
		if (!callbackUrl || typeof callbackUrl !== 'string') {
			throw new HttpsError('invalid-argument', 'Callback URL is required');
		}

		const valid = await verifyTurnstile(captchaToken || '', turnstileSecret.value());
		if (!valid) {
			throw new HttpsError('permission-denied', 'Captcha verification failed');
		}

		// Check if user is banned
		const usersSnap = await admin.firestore()
			.collection('users')
			.where('email', '==', email)
			.limit(1)
			.get();
		if (!usersSnap.empty && usersSnap.docs[0].data().banned) {
			throw new HttpsError('permission-denied', 'Account is banned');
		}

		const signInLink = await admin.auth().generateSignInWithEmailLink(email, {
			url: callbackUrl,
			handleCodeInApp: true,
		});

		const lang = locale === 'en' ? 'en' : 'da';
		const s = emailStrings[lang];

		const resend = new Resend(resendApiKey.value());
		await resend.emails.send({
			from: `Wishy 🎁 <${resendFrom.value()}>`,
			to: email,
			subject: s.subject,
			html: buildLoginEmail(signInLink, lang),
		});

		return { success: true };
	}
);

export const adminListUsers = onCall(
	{ maxInstances: 5, cors: true },
	async (request) => {
		if (!request.auth) {
			throw new HttpsError('unauthenticated', 'Must be logged in');
		}
		await requireAdmin(request.auth.uid);

		const usersSnap = await admin.firestore().collection('users').orderBy('createdAt', 'desc').get();
		return usersSnap.docs.map((doc) => ({
			uid: doc.id,
			...doc.data(),
		}));
	}
);

export const adminBanUser = onCall(
	{ maxInstances: 5, cors: true },
	async (request) => {
		if (!request.auth) {
			throw new HttpsError('unauthenticated', 'Must be logged in');
		}
		await requireAdmin(request.auth.uid);

		const { uid, banned } = request.data;
		if (!uid || typeof uid !== 'string') {
			throw new HttpsError('invalid-argument', 'User ID is required');
		}

		await admin.firestore().doc(`users/${uid}`).update({ banned: !!banned });

		if (banned) {
			await admin.auth().revokeRefreshTokens(uid);
		}

		return { success: true };
	}
);

export const adminDeleteUser = onCall(
	{ maxInstances: 5, cors: true },
	async (request) => {
		if (!request.auth) {
			throw new HttpsError('unauthenticated', 'Must be logged in');
		}
		await requireAdmin(request.auth.uid);

		const { uid } = request.data;
		if (!uid || typeof uid !== 'string') {
			throw new HttpsError('invalid-argument', 'User ID is required');
		}

		// Prevent self-deletion
		if (uid === request.auth.uid) {
			throw new HttpsError('invalid-argument', 'Cannot delete your own account');
		}

		// Delete user's wishlists and sub-collections
		const wishlistsSnap = await admin.firestore()
			.collection(`users/${uid}/wishlists`)
			.get();

		const batch = admin.firestore().batch();
		for (const doc of wishlistsSnap.docs) {
			const itemsSnap = await admin.firestore().collection(`users/${uid}/wishlists/${doc.id}/items`).get();
			for (const item of itemsSnap.docs) batch.delete(item.ref);
			const reservationsSnap = await admin.firestore().collection(`users/${uid}/wishlists/${doc.id}/reservations`).get();
			for (const res of reservationsSnap.docs) batch.delete(res.ref);
			batch.delete(doc.ref);
		}
		batch.delete(admin.firestore().doc(`users/${uid}`));
		await batch.commit();

		await admin.auth().deleteUser(uid);

		return { success: true };
	}
);

// One-time setup: call this after first login to set admin role
export const setupAdmin = onCall(
	{ maxInstances: 1, cors: true },
	async (request) => {
		if (!request.auth) {
			throw new HttpsError('unauthenticated', 'Must be logged in');
		}

		const userRecord = await admin.auth().getUser(request.auth.uid);
		if (userRecord.email !== ADMIN_EMAIL) {
			throw new HttpsError('permission-denied', 'Not authorized');
		}

		await admin.firestore().doc(`users/${request.auth.uid}`).update({ role: 'admin' });
		return { success: true };
	}
);

function getMetaContent(html: string, property: string): string {
	const patterns = [
		new RegExp(`<meta[^>]+(?:property|name)=["']${property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]+content=["']([^"']+)["']`, 'i'),
		new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i'),
	];
	for (const p of patterns) {
		const m = html.match(p);
		if (m) return m[1].trim();
	}
	return '';
}

function extractAllImages(html: string, baseUrl: string): string[] {
	const seen = new Set<string>();
	const images: { url: string; score: number }[] = [];

	const imgRegex = /<img[^>]+>/gi;
	let match;
	while ((match = imgRegex.exec(html)) !== null) {
		const tag = match[0];

		const srcMatch = tag.match(/src=["']([^"']+)["']/i);
		if (!srcMatch) continue;
		let src = srcMatch[1];

		if (src.startsWith('data:') || src.includes('spacer') || src.includes('pixel')) continue;

		try {
			src = new URL(src, baseUrl).href;
		} catch {
			continue;
		}

		if (seen.has(src)) continue;
		seen.add(src);

		const widthMatch = tag.match(/width=["']?(\d+)/i);
		const heightMatch = tag.match(/height=["']?(\d+)/i);
		const w = widthMatch ? parseInt(widthMatch[1]) : 0;
		const h = heightMatch ? parseInt(heightMatch[1]) : 0;

		if ((w > 0 && w < 80) || (h > 0 && h < 80)) continue;

		const junkPatterns = /logo|icon|favicon|badge|avatar|sprite|banner-ad|tracking|analytics|1x1|transparent\.|placeholder/i;
		if (junkPatterns.test(src)) continue;

		let score = 0;
		if (/product|hero|main|primary|large|full|zoom|gallery/i.test(src)) score += 3;
		if (/product|hero|main/i.test(tag.match(/alt=["']([^"']*)["']/i)?.[1] || '')) score += 2;
		if (w > 300 || h > 300) score += 2;
		if (w > 0 && h > 0) score += 1;

		images.push({ url: src, score });
	}

	images.sort((a, b) => b.score - a.score);
	return images.slice(0, 12).map((i) => i.url);
}

export const scrapeUrl = onCall(
	{ maxInstances: 10, secrets: [openaiApiKey], cors: true },
	async (request) => {
		if (!request.auth) {
			throw new HttpsError('unauthenticated', 'Must be logged in');
		}

		const { url } = request.data;
		if (!url || typeof url !== 'string') {
			throw new HttpsError('invalid-argument', 'URL is required');
		}

		try {
			new URL(url);
		} catch {
			throw new HttpsError('invalid-argument', 'Invalid URL');
		}

		let ogTitle = '';
		let ogDescription = '';
		let ogImage = '';
		let ogPrice = '';
		let ogCurrency = '';
		let ogSiteName = '';
		let allImages: string[] = [];

		try {
			const { result, html } = await ogs({
				url,
				timeout: 8,
				fetchOptions: {
					headers: {
						'User-Agent': 'Mozilla/5.0 (compatible; Wishy/1.0)',
						'Accept-Language': 'da,en',
					},
				},
			}) as { result: Record<string, any>; html: string };

			ogTitle = result.ogTitle || result.dcTitle || '';
			ogDescription = result.ogDescription || result.dcDescription || '';
			ogImage = result.ogImage?.[0]?.url || '';
			ogSiteName = result.ogSiteName || '';

			if (html) {
				ogPrice = getMetaContent(html, 'product:price:amount')
					|| getMetaContent(html, 'og:price:amount')
					|| '';
				ogCurrency = getMetaContent(html, 'product:price:currency')
					|| getMetaContent(html, 'og:price:currency')
					|| '';
				allImages = extractAllImages(html, url);
			}
		} catch {
			throw new HttpsError('internal', 'Failed to scrape URL');
		}

		if (ogImage && !allImages.includes(ogImage)) {
			allImages.unshift(ogImage);
		}
		allImages = allImages.slice(0, 10);

		let cleanedName = ogTitle;
		let extractedPrice = ogPrice;
		let extractedCurrency = ogCurrency;
		let extractedNotes = '';
		let rankedImages = allImages;

		if (ogTitle || ogDescription) {
			try {
				const openai = new OpenAI({ apiKey: openaiApiKey.value() });

				const prompt = `You are a product data extractor. Given a scraped webpage's title, description, and image URLs, extract structured product info.

Title: ${ogTitle}
Site: ${ogSiteName}
Description: ${ogDescription}
${ogPrice ? `OG Price: ${ogPrice} ${ogCurrency}` : ''}

Image URLs:
${allImages.map((u, i) => `${i + 1}. ${u}`).join('\n')}

Return JSON only, no markdown:
{
  "name": "clean product name without site name, 'buy now', or other junk",
  "price": number or null (extract from description if not in OG tags, use the primary/sale price),
  "currency": "three letter currency code or null",
  "notes": "useful details: size, color, material, key specs found in description. One short sentence or empty string",
  "imageRanking": [array of image numbers, best product image first. Only include numbers that look like actual product photos based on URL patterns]
}`;

				const completion = await openai.chat.completions.create({
					model: 'gpt-4o-mini',
					messages: [{ role: 'user', content: prompt }],
					temperature: 0.1,
					max_tokens: 300,
				});

				const text = completion.choices[0]?.message?.content?.trim() || '';
				const jsonMatch = text.match(/\{[\s\S]*\}/);
				if (jsonMatch) {
					const parsed = JSON.parse(jsonMatch[0]);
					if (parsed.name) cleanedName = parsed.name;
					if (parsed.price != null && parsed.price !== 0 && !extractedPrice) {
						extractedPrice = String(parsed.price);
					}
					if (parsed.currency && !extractedCurrency) {
						extractedCurrency = parsed.currency;
					}
					if (parsed.notes) extractedNotes = parsed.notes;
					if (parsed.imageRanking?.length) {
						const reordered: string[] = [];
						for (const idx of parsed.imageRanking) {
							const i = Number(idx) - 1;
							if (i >= 0 && i < allImages.length) {
								reordered.push(allImages[i]);
							}
						}
						for (const img of allImages) {
							if (!reordered.includes(img)) reordered.push(img);
						}
						rankedImages = reordered;
					}
				}
			} catch (e) {
				// AI failed — return raw scraped data
			}
		}

		return {
			name: cleanedName || null,
			description: ogDescription || null,
			images: rankedImages,
			price: extractedPrice || null,
			currency: extractedCurrency || null,
			notes: extractedNotes || null,
			siteName: ogSiteName || null,
		};
	}
);

export const addItem = onRequest(
	{ maxInstances: 10, cors: true },
	async (req, res) => {
		if (req.method !== 'POST') {
			res.status(405).json({ error: 'Method not allowed' });
			return;
		}

		const { apiKey, name, url, price, currency, notes, imageUrl } = req.body;

		if (!apiKey || typeof apiKey !== 'string') {
			res.status(401).json({ error: 'API key is required' });
			return;
		}

		if (!name && !url) {
			res.status(400).json({ error: 'At least name or url is required' });
			return;
		}

		const usersSnap = await admin.firestore()
			.collection('users')
			.where('apiKey', '==', apiKey)
			.limit(1)
			.get();

		if (usersSnap.empty) {
			res.status(401).json({ error: 'Invalid API key' });
			return;
		}

		const userDoc = usersSnap.docs[0];
		const userId = userDoc.id;

		const wishlistsSnap = await admin.firestore()
			.collection(`users/${userId}/wishlists`)
			.limit(1)
			.get();

		if (wishlistsSnap.empty) {
			res.status(404).json({ error: 'No wishlist found' });
			return;
		}

		const wishlistId = wishlistsSnap.docs[0].id;

		const itemsSnap = await admin.firestore()
			.collection(`users/${userId}/wishlists/${wishlistId}/items`)
			.get();

		const itemData = {
			name: name || url,
			url: url || null,
			price: typeof price === 'number' ? price : null,
			currency: currency || null,
			imageUrl: imageUrl || null,
			notes: notes || null,
			favorite: false,
			order: itemsSnap.size,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
		};

		const docRef = await admin.firestore()
			.collection(`users/${userId}/wishlists/${wishlistId}/items`)
			.add(itemData);

		res.status(201).json({ success: true, itemId: docRef.id });
	}
);

function generateToken(): string {
	return randomBytes(24).toString('base64url');
}

const reserveRequestStrings: Record<string, Record<string, string>> = {
	da: {
		subject: 'Bekræft reservation af {giftName} til {userName} 🎁',
		heading: 'Vil du reservere {giftName} til {userName}?',
		button: '🎁 Reserver gave',
		expiry: 'Linket udløber om 1 time.',
		ignore: 'Hvis du ikke har bedt om dette, kan du ignorere denne email.',
		tagline: 'Din families ønskeliste',
	},
	en: {
		subject: 'Confirm reservation of {giftName} for {userName} 🎁',
		heading: 'Want to reserve {giftName} for {userName}?',
		button: '🎁 Reserve gift',
		expiry: 'This link expires in 1 hour.',
		ignore: "If you didn't request this, you can safely ignore this email.",
		tagline: 'Your family wishlist',
	},
};

const reserveConfirmStrings: Record<string, Record<string, string>> = {
	da: {
		subject: '{giftName} til {userName} er reserveret ✨',
		heading: 'Du har reserveret {giftName} til {userName}',
		body: '',
		unreserve: 'Fortryd reservation',
		tagline: 'Din families ønskeliste',
	},
	en: {
		subject: '{giftName} for {userName} is reserved ✨',
		heading: 'You reserved {giftName} for {userName}',
		body: '',
		unreserve: 'Cancel reservation',
		tagline: 'Your family wishlist',
	},
};

function giftCardHtml(itemData: { name: string; imageUrl?: string | null; price?: number | null; currency?: string | null }): string {
	const img = itemData.imageUrl
		? `<img src="${itemData.imageUrl}" alt="${itemData.name}" style="width:80px;height:80px;object-fit:cover;border-radius:12px;border:2px solid rgba(249,168,196,0.3);" />`
		: '';
	const price = itemData.price
		? `<p style="margin:4px 0 0;font-size:14px;font-weight:700;color:#e8567f;">${itemData.price} ${itemData.currency || 'DKK'}</p>`
		: '';
	return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf8f4;border-radius:16px;border:2px solid rgba(249,168,196,0.2);margin:20px 0;">
<tr><td style="padding:16px;text-align:center;">
	${img}
	<p style="margin:8px 0 0;font-size:18px;font-weight:800;color:#2e1065;">${itemData.name}</p>
	${price}
</td></tr>
</table>`;
}

function emailShell(locale: string, tagline: string, innerHtml: string): string {
	return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#fdf8f4;font-family:'Nunito',system-ui,-apple-system,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf8f4;min-height:100vh;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;">
<tr><td align="center" style="padding-bottom:32px;">
	<span style="font-size:48px;line-height:1;">🎁</span><br>
	<span style="font-size:28px;font-weight:800;background:linear-gradient(to right,#e8567f,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Wishy</span><br>
	<span style="font-size:14px;color:#6b5a8a;font-weight:500;">${tagline}</span>
</td></tr>
<tr><td>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:20px;border:2px solid rgba(249,168,196,0.3);box-shadow:0 4px 24px rgba(232,86,127,0.08);">
<tr><td style="padding:40px 36px;text-align:center;">
${innerHtml}
</td></tr>
</table>
</td></tr>
<tr><td align="center" style="padding-top:28px;">
	<p style="margin:0;font-size:12px;color:#9b8ab8;">Wishy &mdash; ${tagline}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function buildReserveRequestEmail(confirmUrl: string, itemData: { name: string; imageUrl?: string | null; price?: number | null; currency?: string | null }, ownerName: string, locale: string): string {
	const s = reserveRequestStrings[locale] || reserveRequestStrings['da'];
	const heading = s.heading.replace('{giftName}', itemData.name).replace('{userName}', ownerName);
	const inner = `<h1 style="margin:0 0 4px;font-size:24px;font-weight:800;color:#2e1065;">${heading}</h1>
${giftCardHtml(itemData)}
<a href="${confirmUrl}" target="_blank" style="display:inline-block;background:linear-gradient(to right,#16a34a,#059669);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 48px;border-radius:50px;box-shadow:0 4px 16px rgba(22,163,74,0.25);">
	${s.button}
</a>
<p style="margin:20px 0 0;font-size:13px;color:#9b8ab8;">${s.expiry}<br>${s.ignore}</p>`;
	return emailShell(locale, s.tagline, inner);
}

function buildReserveConfirmEmail(itemData: { name: string; imageUrl?: string | null; price?: number | null; currency?: string | null }, unreserveUrl: string, ownerName: string, locale: string): string {
	const s = reserveConfirmStrings[locale] || reserveConfirmStrings['da'];
	const heading = s.heading.replace('{giftName}', itemData.name).replace('{userName}', ownerName);
	const inner = `<h1 style="margin:0 0 4px;font-size:24px;font-weight:800;color:#2e1065;">${heading}</h1>
${giftCardHtml(itemData)}
<a href="${unreserveUrl}" target="_blank" style="display:inline-block;color:#e8567f;font-size:14px;font-weight:600;text-decoration:underline;">
	${s.unreserve}
</a>`;
	return emailShell(locale, s.tagline, inner);
}

async function fetchItemData(ownerId: string, wishlistId: string, itemId: string): Promise<{ name: string; imageUrl?: string | null; price?: number | null; currency?: string | null }> {
	const itemDoc = await admin.firestore().doc(`users/${ownerId}/wishlists/${wishlistId}/items/${itemId}`).get();
	if (!itemDoc.exists) throw new HttpsError('not-found', 'Item not found');
	const d = itemDoc.data()!;
	return { name: d.name, imageUrl: d.imageUrl || null, price: d.price || null, currency: d.currency || null };
}

async function createReservationAndNotify(opts: {
	ownerId: string;
	wishlistId: string;
	itemId: string;
	reservedBy: string;
	reservedByName: string;
	reservedByEmail: string;
	itemData: { name: string; imageUrl?: string | null; price?: number | null; currency?: string | null };
	baseUrl: string;
	username: string;
	ownerName: string;
	locale: string;
}): Promise<void> {
	const unreserveToken = generateToken();

	await admin.firestore().doc(`users/${opts.ownerId}/wishlists/${opts.wishlistId}/reservations/${opts.itemId}`).set({
		reservedBy: opts.reservedBy,
		reservedByName: opts.reservedByName,
		reservedByEmail: opts.reservedByEmail,
		reservedAt: admin.firestore.FieldValue.serverTimestamp(),
	});

	await admin.firestore().doc(`unreserveTokens/${unreserveToken}`).set({
		ownerId: opts.ownerId,
		wishlistId: opts.wishlistId,
		itemId: opts.itemId,
		email: opts.reservedByEmail,
		username: opts.username,
		createdAt: admin.firestore.FieldValue.serverTimestamp(),
	});

	const unreserveUrl = `${opts.baseUrl}/reserve/cancel?token=${unreserveToken}`;
	const lang = opts.locale === 'en' ? 'en' : 'da';
	const s = reserveConfirmStrings[lang];

	const resend = new Resend(resendApiKey.value());
	await resend.emails.send({
		from: `Wishy 🎁 <${resendFrom.value()}>`,
		to: opts.reservedByEmail,
		subject: s.subject.replace('{giftName}', opts.itemData.name).replace('{userName}', opts.ownerName),
		html: buildReserveConfirmEmail(opts.itemData, unreserveUrl, opts.ownerName, lang),
	});
}

export const requestReservation = onCall(
	{ maxInstances: 10, secrets: [resendApiKey, resendFrom], cors: true },
	async (request) => {
		const { email, wishlistId, itemId, locale, baseUrl, username, ownerId } = request.data;

		if (!email || typeof email !== 'string' || !email.includes('@')) {
			throw new HttpsError('invalid-argument', 'Valid email is required');
		}
		if (!wishlistId || !itemId || !baseUrl || !username || !ownerId) {
			throw new HttpsError('invalid-argument', 'Missing required fields');
		}

		const wishlistDoc = await admin.firestore().doc(`users/${ownerId}/wishlists/${wishlistId}`).get();
		if (!wishlistDoc.exists) throw new HttpsError('not-found', 'Wishlist not found');
		const ownerName = wishlistDoc.data()!.ownerName || username;

		const existingRes = await admin.firestore().doc(`users/${ownerId}/wishlists/${wishlistId}/reservations/${itemId}`).get();
		if (existingRes.exists) throw new HttpsError('already-exists', 'Item is already reserved');

		const itemData = await fetchItemData(ownerId, wishlistId, itemId);
		const token = generateToken();
		const normalizedEmail = email.toLowerCase().trim();

		await admin.firestore().doc(`pendingReservations/${token}`).set({
			email: normalizedEmail,
			ownerId,
			wishlistId,
			itemId,
			username,
			baseUrl,
			locale: locale || 'da',
			expiresAt: new Date(Date.now() + 60 * 60 * 1000),
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		const confirmUrl = `${baseUrl}/reserve/confirm?token=${token}`;
		const lang = locale === 'en' ? 'en' : 'da';
		const s = reserveRequestStrings[lang];

		const resend = new Resend(resendApiKey.value());
		await resend.emails.send({
			from: `Wishy 🎁 <${resendFrom.value()}>`,
			to: normalizedEmail,
			subject: s.subject.replace('{giftName}', itemData.name).replace('{userName}', ownerName),
			html: buildReserveRequestEmail(confirmUrl, itemData, ownerName, lang),
		});

		return { success: true };
	}
);

export const confirmReservation = onCall(
	{ maxInstances: 10, secrets: [resendApiKey, resendFrom], cors: true },
	async (request) => {
		const { token } = request.data;

		if (!token || typeof token !== 'string') {
			throw new HttpsError('invalid-argument', 'Token is required');
		}

		const pendingDoc = await admin.firestore().doc(`pendingReservations/${token}`).get();
		if (!pendingDoc.exists) throw new HttpsError('not-found', 'Invalid or expired link');

		const pending = pendingDoc.data()!;

		if (pending.expiresAt.toDate() < new Date()) {
			await pendingDoc.ref.delete();
			throw new HttpsError('deadline-exceeded', 'Link has expired');
		}

		const existingRes = await admin.firestore().doc(`users/${pending.ownerId}/wishlists/${pending.wishlistId}/reservations/${pending.itemId}`).get();
		if (existingRes.exists) {
			await pendingDoc.ref.delete();
			throw new HttpsError('already-exists', 'Item is already reserved');
		}

		const wishlistDoc = await admin.firestore().doc(`users/${pending.ownerId}/wishlists/${pending.wishlistId}`).get();
		const itemData = await fetchItemData(pending.ownerId, pending.wishlistId, pending.itemId);

		await createReservationAndNotify({
			ownerId: pending.ownerId,
			wishlistId: pending.wishlistId,
			itemId: pending.itemId,
			reservedBy: 'visitor',
			reservedByName: pending.email.split('@')[0],
			reservedByEmail: pending.email,
			itemData,
			baseUrl: pending.baseUrl,
			username: pending.username,
			ownerName: wishlistDoc.data()?.ownerName || pending.username,
			locale: pending.locale,
		});

		await pendingDoc.ref.delete();

		return { success: true, username: pending.username, email: pending.email };
	}
);

export const reserveItem = onCall(
	{ maxInstances: 10, secrets: [resendApiKey, resendFrom], cors: true },
	async (request) => {
		if (!request.auth) throw new HttpsError('unauthenticated', 'Must be logged in');

		const { wishlistId, itemId, baseUrl, username, locale, ownerId } = request.data;

		if (!wishlistId || !itemId || !baseUrl || !username || !ownerId) {
			throw new HttpsError('invalid-argument', 'Missing required fields');
		}

		const wishlistDoc = await admin.firestore().doc(`users/${ownerId}/wishlists/${wishlistId}`).get();
		if (!wishlistDoc.exists) throw new HttpsError('not-found', 'Wishlist not found');

		if (ownerId === request.auth.uid) {
			throw new HttpsError('permission-denied', 'Cannot reserve on your own list');
		}

		const existingRes = await admin.firestore().doc(`users/${ownerId}/wishlists/${wishlistId}/reservations/${itemId}`).get();
		if (existingRes.exists) throw new HttpsError('already-exists', 'Item is already reserved');

		const userDoc = await admin.firestore().doc(`users/${request.auth.uid}`).get();
		const userData = userDoc.data();
		const userEmail = userData?.email || request.auth.token.email || '';
		const userName = userData?.displayName || userEmail.split('@')[0] || '';

		const itemData = await fetchItemData(ownerId, wishlistId, itemId);

		await createReservationAndNotify({
			ownerId,
			wishlistId,
			itemId,
			reservedBy: request.auth.uid,
			reservedByName: userName,
			reservedByEmail: userEmail,
			itemData,
			baseUrl,
			username,
			ownerName: wishlistDoc.data()!.ownerName || username,
			locale: locale || 'da',
		});

		return { success: true };
	}
);

export const cancelReservation = onCall(
	{ maxInstances: 10, cors: true },
	async (request) => {
		const { token } = request.data;

		if (!token || typeof token !== 'string') {
			throw new HttpsError('invalid-argument', 'Token is required');
		}

		const tokenDoc = await admin.firestore().doc(`unreserveTokens/${token}`).get();
		if (!tokenDoc.exists) throw new HttpsError('not-found', 'Invalid link');

		const tokenData = tokenDoc.data()!;

		const resDoc = await admin.firestore().doc(`users/${tokenData.ownerId}/wishlists/${tokenData.wishlistId}/reservations/${tokenData.itemId}`).get();
		if (resDoc.exists) {
			await resDoc.ref.delete();
		}

		await tokenDoc.ref.delete();

		return { success: true, username: tokenData.username || '' };
	}
);

export const notifyNewWishlist = onDocumentCreated(
	{ document: 'users/{userId}/wishlists/{wishlistId}', secrets: [resendApiKey, resendFrom] },
	async (event) => {
		const data = event.data?.data();
		if (!data) return;

		const resend = new Resend(resendApiKey.value());
		await resend.emails.send({
			from: `Wishy 🎁 <${resendFrom.value()}>`,
			to: ADMIN_EMAIL,
			subject: 'New wishlist created on Wishy 🎉',
			html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#fdf8f4;font-family:system-ui,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf8f4;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;">
<tr><td align="center" style="padding-bottom:24px;">
	<span style="font-size:48px;">🎉</span>
</td></tr>
<tr><td>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;border:2px solid rgba(249,168,196,0.3);">
<tr><td style="padding:32px;text-align:center;">
	<h1 style="margin:0 0 16px;font-size:20px;color:#2e1065;">New wishlist created!</h1>
	<p style="margin:0 0 8px;font-size:16px;color:#6b5a8a;"><strong>${data.ownerName || 'Someone'}</strong> just created a wishlist.</p>
	<p style="margin:0;font-size:14px;color:#9b8ab8;">Title: ${data.title || 'Untitled'}</p>
</td></tr>
</table>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`,
		});
	}
);

export const generateItemEmoji = onDocumentCreated(
	{ document: 'users/{userId}/wishlists/{wishlistId}/items/{itemId}', secrets: [openaiApiKey] },
	async (event) => {
		const data = event.data?.data();
		if (!data || data.emoji) return;

		try {
			const openai = new OpenAI({ apiKey: openaiApiKey.value() });
			const completion = await openai.chat.completions.create({
				model: 'gpt-5.4-nano',
				messages: [{ role: 'user', content: `Pick one emoji that best represents this gift: "${data.name}". Reply with only the emoji, nothing else.` }],
				temperature: 0.5,
				max_tokens: 5,
			});

			const emoji = completion.choices[0]?.message?.content?.trim() || '🎁';
			await event.data?.ref.update({ emoji });
		} catch {
			await event.data?.ref.update({ emoji: '🎁' });
		}
	}
);

// ── Exchange rates (weekly) ─────────────────────────────────────────
export const updateExchangeRates = onSchedule('every monday 06:00', async () => {
	const res = await fetch('https://api.frankfurter.dev/v1/latest?base=DKK');
	if (!res.ok) throw new Error(`Frankfurter API error: ${res.status}`);
	const data = await res.json() as { rates: Record<string, number> };
	const toDKK: Record<string, number> = {};
	for (const [currency, rate] of Object.entries(data.rates)) {
		toDKK[currency] = Math.round((1 / rate) * 10000) / 10000;
	}
	toDKK['DKK'] = 1;
	await admin.firestore().doc('config/exchangeRates').set({
		rates: toDKK,
		updatedAt: admin.firestore.FieldValue.serverTimestamp(),
	});
});
