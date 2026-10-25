// scraper.js — LinkedIn and Instagram public profile scraper
const axios = require('axios');
const { parse } = require('node-html-parser');

// ─── LinkedIn Scraper ────────────────────────────────────────────────────────
async function scrapeLinkedIn(profileUrl) {
  try {
    // Normalize URL
    const url = profileUrl.includes('linkedin.com') ? profileUrl : `https://www.linkedin.com/in/${profileUrl}`;
    
    // Try fetching public page
    const resp = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 15000,
      maxRedirects: 5,
    });

    const root = parse(resp.data);
    
    // Extract structured data from JSON-LD
    const jsonLdScripts = root.querySelectorAll('script[type="application/ld+json"]');
    let structuredData = {};
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script.text);
        if (data['@type'] === 'Person' || data.name) {
          structuredData = data;
          break;
        }
      } catch {}
    }

    // Extract from meta tags
    const getMetaContent = (name) => {
      const el = root.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      return el ? el.getAttribute('content') : '';
    };

    const name = structuredData.name || 
                 getMetaContent('og:title') || 
                 root.querySelector('title')?.text?.split('|')[0]?.trim() || '';
    
    const headline = structuredData.description || 
                     getMetaContent('og:description') || 
                     getMetaContent('description') || '';
    
    const image = structuredData.image || getMetaContent('og:image') || '';

    // Extract text content
    const bodyText = root.querySelector('body')?.text || '';
    
    return {
      url,
      name: name.replace(' | LinkedIn', '').trim(),
      headline: headline.substring(0, 500),
      image,
      structuredData,
      rawText: bodyText.substring(0, 3000),
      source: 'direct',
    };
  } catch (err) {
    console.error('LinkedIn scrape error:', err.message);
    // Return partial data even on error
    return {
      url: profileUrl,
      name: extractNameFromLinkedInUrl(profileUrl),
      headline: '',
      image: '',
      rawText: '',
      error: err.message,
      source: 'fallback',
    };
  }
}

function extractNameFromLinkedInUrl(url) {
  const match = url.match(/linkedin\.com\/in\/([^/?]+)/);
  if (!match) return '';
  return match[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Instagram Scraper ───────────────────────────────────────────────────────
async function scrapeInstagram(profileUrl) {
  try {
    const username = extractInstagramUsername(profileUrl);
    if (!username) throw new Error('Invalid Instagram URL');

    // Try Instagram's public API endpoint
    const apiUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
    
    try {
      const resp = await axios.get(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.5',
          'X-IG-App-ID': '936619743392459',
          'X-ASBD-ID': '198387',
          'X-IG-WWW-Claim': '0',
          'Origin': 'https://www.instagram.com',
          'Referer': `https://www.instagram.com/${username}/`,
        },
        timeout: 15000,
      });

      const data = resp.data?.data?.user;
      if (data) {
        return {
          username,
          url: `https://www.instagram.com/${username}/`,
          full_name: data.full_name || '',
          bio: data.biography || '',
          followers: data.edge_followed_by?.count || 0,
          following: data.edge_follow?.count || 0,
          posts_count: data.edge_owner_to_timeline_media?.count || 0,
          profile_pic_url: data.profile_pic_url_hd || data.profile_pic_url || '',
          is_verified: data.is_verified || false,
          external_url: data.external_url || '',
          recent_posts: (data.edge_owner_to_timeline_media?.edges || []).slice(0, 12).map(e => ({
            caption: e.node.edge_media_to_caption?.edges?.[0]?.node?.text || '',
            likes: e.node.edge_media_preview_like?.count || 0,
            timestamp: e.node.taken_at_timestamp,
            type: e.node.__typename,
          })),
          source: 'api',
        };
      }
    } catch (apiErr) {
      console.log('Instagram API failed, trying public page...');
    }

    // Fallback: scrape public page
    const pageUrl = `https://www.instagram.com/${username}/`;
    const resp = await axios.get(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      timeout: 15000,
    });

    const root = parse(resp.data);
    const getMetaContent = (name) => {
      const el = root.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      return el ? el.getAttribute('content') : '';
    };

    // Extract shared data
    const sharedDataMatch = resp.data.match(/<script type="application\/json" data-sjs>(\{.+?\})<\/script>/);
    let sharedData = {};
    if (sharedDataMatch) {
      try { sharedData = JSON.parse(sharedDataMatch[1]); } catch {}
    }

    return {
      username,
      url: pageUrl,
      full_name: getMetaContent('og:title')?.split('(')?.[0]?.trim() || username,
      bio: getMetaContent('og:description') || '',
      profile_pic_url: getMetaContent('og:image') || '',
      followers: 0,
      following: 0,
      posts_count: 0,
      recent_posts: [],
      source: 'page',
    };
  } catch (err) {
    console.error('Instagram scrape error:', err.message);
    const username = extractInstagramUsername(profileUrl);
    return {
      username,
      url: profileUrl,
      full_name: username,
      bio: '',
      profile_pic_url: '',
      followers: 0,
      following: 0,
      recent_posts: [],
      error: err.message,
      source: 'fallback',
    };
  }
}

function extractInstagramUsername(url) {
  // Handle various formats: URL, @username, username
  const match = url.match(/instagram\.com\/([^/?#@]+)/);
  if (match) return match[1];
  const atMatch = url.match(/@?([a-zA-Z0-9._]+)/);
  if (atMatch) return atMatch[1];
  return url.replace('@', '');
}

module.exports = { scrapeLinkedIn, scrapeInstagram };
