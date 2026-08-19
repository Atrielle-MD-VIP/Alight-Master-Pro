// GitHub raw proxy list sources
const GITHUB_PROXY_SOURCES = [
  'https://raw.githubusercontent.com/proxifly/free-proxy-list/refs/heads/main/proxies/all/data.txt',
  'https://raw.githubusercontent.com/proxifly/free-proxy-list/refs/heads/main/proxies/protocols/http/data.txt',
  'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt',
  'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt'
];

export interface ProxyItem {
  host: string;
  port: number;
  protocol: string;
  url: string;
}

let cachedProxies: ProxyItem[] = [];
let lastFetchTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache

/**
 * Fetch free proxies from GitHub repositories
 */
export async function loadGithubProxies(): Promise<ProxyItem[]> {
  const now = Date.now();
  if (cachedProxies.length > 0 && now - lastFetchTime < CACHE_TTL) {
    return cachedProxies;
  }

  const proxies: ProxyItem[] = [];

  for (const sourceUrl of GITHUB_PROXY_SOURCES) {
    try {
      console.log(`[ProxyManager] Mengambil proxy gratis dari GitHub: ${sourceUrl}`);
      const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(2000) });
      if (response.ok) {
        const text = await response.text();
        const lines = text.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;

          let protocol = 'http';
          let host = '';
          let port = 80;

          // Check if line starts with protocol (e.g. http://, https://, socks5://)
          const urlMatch = trimmed.match(/^(https?|socks[45]):\/\/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d+)/i);
          if (urlMatch) {
            protocol = urlMatch[1].toLowerCase();
            host = urlMatch[2];
            port = parseInt(urlMatch[3], 10);
          } else {
            // Match plain IP:PORT format
            const plainMatch = trimmed.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d+)/);
            if (plainMatch) {
              host = plainMatch[1];
              port = parseInt(plainMatch[2], 10);
            }
          }

          if (host && port > 0 && port <= 65535) {
            // Prefer HTTP/HTTPS proxies for web fetch compatibility
            if (protocol.startsWith('http')) {
              proxies.push({
                host,
                port,
                protocol,
                url: `${protocol}://${host}:${port}`
              });
            }
          }
        }
      }

      if (proxies.length > 0) {
        console.log(`[ProxyManager] Berhasil memuat ${proxies.length} HTTP/HTTPS proxy dari GitHub.`);
        break; // Successfully loaded proxies
      }
    } catch (err: any) {
      console.warn(`[ProxyManager] Gagal mengambil proxy dari ${sourceUrl}: ${err.message}`);
    }
  }

  cachedProxies = proxies;
  lastFetchTime = Date.now();
  return cachedProxies;
}

/**
 * Get a random HTTP/HTTPS proxy from the loaded list
 */
export async function getRandomProxy(): Promise<ProxyItem | null> {
  const proxies = await loadGithubProxies();
  if (proxies.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * proxies.length);
  return proxies[randomIndex];
}

/**
 * Get total proxy count in memory
 */
export function getProxyCount(): number {
  return cachedProxies.length;
}
