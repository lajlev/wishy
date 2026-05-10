import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';
import ogs from 'open-graph-scraper';
import OpenAI from 'openai';

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
			.collection('wishlists')
			.where('ownerId', '==', uid)
			.get();

		const batch = admin.firestore().batch();
		for (const doc of wishlistsSnap.docs) {
			const itemsSnap = await admin.firestore().collection(`wishlists/${doc.id}/items`).get();
			for (const item of itemsSnap.docs) batch.delete(item.ref);
			const reservationsSnap = await admin.firestore().collection(`wishlists/${doc.id}/reservations`).get();
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
					if (parsed.price && !extractedPrice) {
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
			.collection('wishlists')
			.where('ownerId', '==', userId)
			.limit(1)
			.get();

		if (wishlistsSnap.empty) {
			res.status(404).json({ error: 'No wishlist found' });
			return;
		}

		const wishlistId = wishlistsSnap.docs[0].id;

		const itemsSnap = await admin.firestore()
			.collection(`wishlists/${wishlistId}/items`)
			.get();

		const itemData = {
			name: name || url,
			url: url || null,
			price: typeof price === 'number' ? price : null,
			currency: currency || null,
			imageUrl: imageUrl || null,
			notes: notes || null,
			order: itemsSnap.size,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
		};

		const docRef = await admin.firestore()
			.collection(`wishlists/${wishlistId}/items`)
			.add(itemData);

		res.status(201).json({ success: true, itemId: docRef.id });
	}
);
