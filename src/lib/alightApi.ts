import crypto from 'crypto';

const RYEZEN_BASE = 'https://www.ryezenstore.online';
const TEMPMAIL_BASE = 'https://creatett-seven.vercel.app';

function generateRandomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Origin': RYEZEN_BASE,
    'Referer': `${RYEZEN_BASE}/register`,
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    ...extraHeaders
  };
}

let activeRyezenCookie: string | null = null;

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 503) {
        console.warn(`[RyezenApi] 503 database preparing state. Retry (${i + 1}/${retries})...`);
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      return response;
    } catch (err) {
      if (i === retries) throw err;
      console.warn(`[RyezenApi] Network error: ${(err as Error).message}. Retry (${i + 1}/${retries})...`);
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw new Error('Server RyezenStore tidak merespons setelah beberapa percobaan (503/network error).');
}

export async function getRyezenSession(): Promise<string> {
  if (activeRyezenCookie) {
    return activeRyezenCookie;
  }

  let attempts = 0;
  let lastErr = '';

  while (attempts < 5) {
    attempts++;
    const randomUsername = `usr${generateRandomString(10)}`;
    const randomPassword = `Pass${generateRandomString(8)}1!`;

    console.log(`[RyezenApi] Registering auto account attempt ${attempts}: ${randomUsername}`);
    try {
      const regRes = await fetchWithRetry(`${RYEZEN_BASE}/api/auth/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ username: randomUsername, password: randomPassword })
      }, 1);

      if (!regRes.ok) {
        const errData = await regRes.json().catch(() => ({}));
        const errMsg = errData.error || '';
        if (errMsg.toLowerCase().includes('terdaftar') || errMsg.toLowerCase().includes('menduplikasi') || regRes.status === 400 || regRes.status === 403) {
          console.warn(`[RyezenApi] Register attempt ${attempts} got status ${regRes.status}, retrying...`);
          lastErr = errMsg || `Status ${regRes.status}`;
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        throw new Error(errMsg || `Gagal registrasi akun ke RyezenStore (Status: ${regRes.status})`);
      }

      const loginRes = await fetchWithRetry(`${RYEZEN_BASE}/api/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ username: randomUsername, password: randomPassword })
      }, 1);

      if (!loginRes.ok) {
        const errData = await loginRes.json().catch(() => ({}));
        throw new Error(errData.error || `Gagal login ke RyezenStore (Status: ${loginRes.status})`);
      }

      let cookiesList: string[] = [];
      if (typeof (loginRes.headers as any).getSetCookie === 'function') {
        cookiesList = (loginRes.headers as any).getSetCookie();
      } else {
        const sc = loginRes.headers.get('set-cookie');
        if (sc) cookiesList = [sc];
      }
      if (!cookiesList || cookiesList.length === 0) {
        throw new Error('Server RyezenStore tidak memberikan cookie sesi.');
      }

      const cookieHeader = cookiesList.map((c: string) => c.split(';')[0]).join('; ');
      activeRyezenCookie = cookieHeader;
      console.log(`[RyezenApi] Session cookie obtained for ${randomUsername}`);
      return cookieHeader;
    } catch (err: any) {
      lastErr = err.message || 'Error registrasi';
      if (attempts >= 5) {
        throw new Error(lastErr || 'Server RyezenStore sedang membatasi registrasi. Silakan coba beberapa saat lagi.');
      }
    }
  }

  throw new Error(lastErr || 'Gagal terhubung ke server RyezenStore.');
}

export async function sendOobLinkRemote(email: string) {
  let cookie = await getRyezenSession();

  let sendRes = await fetchWithRetry(`${RYEZEN_BASE}/api/am/send-link`, {
    method: 'POST',
    headers: getHeaders({ Cookie: cookie }),
    body: JSON.stringify({ email })
  }, 2);

  let sendData: any = {};
  try {
    sendData = await sendRes.json();
  } catch {
    sendData = { error: 'Invalid JSON from server RyezenStore' };
  }

  if (!sendRes.ok) {
    if (sendRes.status === 400 || (sendData.error && (sendData.error.toLowerCase().includes('kredit') || sendData.error.toLowerCase().includes('terdaftar') || sendData.error.toLowerCase().includes('menduplikasi')))) {
      console.warn('[RyezenApi] Rotating RyezenStore account...');
      activeRyezenCookie = null;
      cookie = await getRyezenSession();

      sendRes = await fetchWithRetry(`${RYEZEN_BASE}/api/am/send-link`, {
        method: 'POST',
        headers: getHeaders({ Cookie: cookie }),
        body: JSON.stringify({ email })
      }, 2);
      try {
        sendData = await sendRes.json();
      } catch {
        sendData = { error: 'Gagal parsing JSON response' };
      }
    }
  }

  if (!sendRes.ok) {
    return {
      success: false,
      error: sendData.error || `Gagal mengirim link OOB dari server RyezenStore (Status ${sendRes.status})`
    };
  }

  return {
    success: true,
    message: sendData.message || 'Email verifikasi OOB berhasil dipicu ke server Alight Motion!',
    rawResponse: sendData
  };
}

export async function verifyOobLinkRemote(email: string, rawLink: string) {
  const magicLink = rawLink.trim().replace(/&amp;/g, '&');
  let cookie = await getRyezenSession();

  let actRes = await fetchWithRetry(`${RYEZEN_BASE}/api/am/activate`, {
    method: 'POST',
    headers: getHeaders({ Cookie: cookie }),
    body: JSON.stringify({ email, magicLink })
  }, 2);

  let actData: any = {};
  try {
    actData = await actRes.json();
  } catch {
    actData = { error: 'Invalid JSON from server RyezenStore' };
  }

  if (!actRes.ok) {
    if (actRes.status === 400 || (actData.error && (actData.error.toLowerCase().includes('kredit') || actData.error.toLowerCase().includes('terdaftar') || actData.error.toLowerCase().includes('menduplikasi')))) {
      console.warn('[RyezenApi] Rotating RyezenStore account on activate...');
      activeRyezenCookie = null;
      cookie = await getRyezenSession();

      actRes = await fetchWithRetry(`${RYEZEN_BASE}/api/am/activate`, {
        method: 'POST',
        headers: getHeaders({ Cookie: cookie }),
        body: JSON.stringify({ email, magicLink })
      }, 2);
      try {
        actData = await actRes.json();
      } catch {
        actData = { error: 'Gagal parsing JSON response' };
      }
    }
  }

  if (!actRes.ok) {
    return {
      success: false,
      error: actData.error || `Aktivasi gagal dari server RyezenStore (Status ${actRes.status})`
    };
  }

  return {
    success: true,
    message: actData.message || 'Aktivasi Lisensi Alight Motion Pro 1 Tahun Berhasil!',
    data: actData
  };
}

// Tempmail integration helpers
export async function createTempmail() {
  const mailRes = await fetch(`${TEMPMAIL_BASE}/api/tempmail/create`);
  const mailData = await mailRes.json();
  if (!mailData || !mailData.email) {
    throw new Error('Gagal mendapatkan email sementara.');
  }
  return mailData;
}

export async function checkTempmailInbox(email: string) {
  const listRes = await fetch(`${TEMPMAIL_BASE}/api/tempmail/inbox/${email}`);
  const messages = await listRes.json();
  if (Array.isArray(messages) && messages.length > 0) {
    for (const msg of messages) {
      const emailString = JSON.stringify(msg).replace(/\\/g, '');
      const linkRegex = /https?:\/\/(?:[a-zA-Z0-9-]+\.)*(?:alightcreative\.com|alight\.link|alightmotion\.com)\/[^\s"'>]*/;
      const match = emailString.match(linkRegex);
      if (match) {
        return {
          found: true,
          magicLink: match[0].replace(/&amp;/g, '&'),
          messages
        };
      }
    }
    return { found: false, messages };
  }
  return { found: false, messages: [] };
}

