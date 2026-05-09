function doGet(e) {
  var url = e.parameter.url;
  if (!url) {
    return jsonResponse({ error: 'Missing url parameter' });
  }

  try {
    var response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Wishy/1.0)',
        'Accept': 'text/html',
        'Accept-Language': 'da,en'
      }
    });

    var html = response.getContentText();

    var result = {
      name: getMeta(html, 'og:title') || getMeta(html, 'twitter:title') || getTitle(html),
      description: getMeta(html, 'og:description') || getMeta(html, 'twitter:description'),
      imageUrl: getMeta(html, 'og:image') || getMeta(html, 'twitter:image'),
      price: getMeta(html, 'og:price:amount') || getMeta(html, 'product:price:amount') || getMeta(html, 'product:price'),
      currency: getMeta(html, 'og:price:currency') || getMeta(html, 'product:price:currency'),
      siteName: getMeta(html, 'og:site_name')
    };

    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function getMeta(html, property) {
  var patterns = [
    new RegExp('<meta[^>]+(?:property|name)=["\']' + escapeRegex(property) + '["\'][^>]+content=["\']([^"\']+)["\']', 'i'),
    new RegExp('<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']' + escapeRegex(property) + '["\']', 'i')
  ];
  for (var i = 0; i < patterns.length; i++) {
    var match = html.match(patterns[i]);
    if (match) return match[1].trim();
  }
  return null;
}

function getTitle(html) {
  var match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : null;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
