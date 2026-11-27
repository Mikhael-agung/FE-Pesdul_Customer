import { expect, test, type Page } from '@playwright/test';

const API = '**/api/v1';
const ok = (data: unknown, status = 200) => ({ status, json: { data } });

const menus = [
  { id: 1, name: 'Nasi Goreng', price: 25000, image_url: '', category: { id: 1, name: 'Makanan' }, has_spice_level: true, spice_levels: [1, 2, 3], stock_remaining: 20, is_available: true },
  { id: 2, name: 'Es Teh', price: 5000, image_url: '', category: { id: 2, name: 'Minuman' }, has_spice_level: false, spice_levels: [], stock_remaining: 3, is_available: true },
  { id: 3, name: 'Soto', price: 20000, image_url: '', category: { id: 1, name: 'Makanan' }, has_spice_level: false, spice_levels: [], stock_remaining: 0, is_available: false },
];

type Opts = { dineInFull?: boolean; method?: 'qris' | 'cashier'; methods?: object[] };

async function mockApi(page: Page, opts: Opts = {}) {
  let polls = 0;
  const order = (status: string, extra: object = {}) => ({
    code: 'PSD-261123-0001', order_type: 'takeaway', payment_method: opts.method ?? 'qris', status,
    items: [
      { menu_id: 1, name: 'Nasi Goreng', qty: 2, unit_price: 25000, spice_level: 2, note: null },
      { menu_id: 2, name: 'Es Teh', qty: 1, unit_price: 5000, spice_level: null, note: null },
    ],
    qr_token: qrFor(status),
    estimate_minutes: null, can_change_type: status === 'paid' || (opts.method === 'cashier' && status === 'pending_payment'), type_logs: [],
    payment: { status: status === 'pending_payment' ? 'pending' : 'paid', gross_amount: 55000, qr_string: '000201QRIS', qr_url: null, expires_at: new Date(Date.now() + 15 * 60_000).toISOString() },
    created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 15 * 60_000).toISOString(), ...extra,
  });
  let current = 'pending_payment';

  const qrFor = (s: string) => s === 'paid' || (opts.method === 'cashier' && s === 'pending_payment') ? opts.method === 'cashier' ? 'TOKEN-CASH' : 'TOKEN-ABC' : null;

  await page.route(`${API}/auth/register`, (r) => r.fulfill({ status: 201, json: { data: { user: { id: 1, name: 'Agung', identifier: 'a@a.com' }, token: 't' } } }));
  await page.route(`${API}/auth/me`, (r) => r.fulfill(ok({ id: 1, name: 'Agung', identifier: 'a@a.com' })));
  await page.route(`${API}/categories`, (r) => r.fulfill(ok([{ id: 1, name: 'Makanan' }, { id: 2, name: 'Minuman' }])));
  await page.route(`${API}/menus**`, (r) => r.fulfill(ok(menus)));
  await page.route(`${API}/settings/public`, (r) => r.fulfill(ok({
    dine_in_full: !!opts.dineInFull,
    payment_methods: opts.methods ?? [
      { id: 'qris', label: 'QRIS', enabled: true },
      { id: 'cashier', label: 'Bayar di Kasir', enabled: true },
      { id: 'va', label: 'Virtual Account', enabled: false },
    ],
  })));
  await page.route(`${API}/cart/validate`, async (r) => {
    const items = r.request().postDataJSON().items as { menu_id: number; qty: number }[];
    const price: Record<number, number> = { 1: 25000, 2: 5000 };
    await r.fulfill(ok({ valid: true, total: items.reduce((s, i) => s + price[i.menu_id] * i.qty, 0), items: items.map((i) => ({ menu_id: i.menu_id, unit_price: price[i.menu_id], qty: i.qty, available: true, stock_remaining: 10 })) }));
  });
  await page.route(`${API}/orders`, (r) => {
    if (r.request().method() === 'POST') {
      const body = r.request().postDataJSON();
      expect(body.order_type).toBe('takeaway');
      expect(body.payment_method).toBe(opts.method ?? 'qris');
      const extra = opts.method === 'cashier' ? { qr_token: 'TOKEN-CASH', payment: null } : {};
      return r.fulfill(ok(order('pending_payment', extra), 201));
    }
    return r.fulfill({ json: { data: [], meta: { current_page: 1, per_page: 10, total: 0, last_page: 1 } } });
  });
  await page.route(`${API}/orders/PSD-261123-0001`, (r) => r.fulfill(ok(order(current))));
  await page.route(`${API}/orders/PSD-261123-0001/payment/status`, (r) => {
    polls++;
    if (polls >= 2) current = 'paid'; // "settlement" setelah poll ke-2
    return r.fulfill(ok({ order_status: current, payment: order(current).payment }));
  });
}

test('daftar → pesan → bayar → QR pesanan', async ({ page }) => {
  await mockApi(page);
  await page.goto('/register');
  await expect(page.getByTestId('splash')).toBeVisible();
  await page.getByLabel('Nama').fill('Agung');
  await page.getByLabel('Nomor HP atau Email').fill('a@a.com');
  await page.getByLabel('Kata Sandi', { exact: true }).fill('password123');
  await page.getByLabel('Ulangi Kata Sandi').fill('password123');
  await page.getByRole('button', { name: 'Daftar Sekarang' }).click();

  // Menu
  await expect(page.getByTestId('menu-card')).toHaveCount(3);
  await expect(page.getByText('Habis', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tambah Soto' })).toBeDisabled();

  // Menu pedas → sheet wajib pilih level
  await page.getByRole('button', { name: 'Tambah Nasi Goreng' }).click();
  const confirm = page.getByRole('dialog').getByRole('button', { name: 'Tambah' });
  await expect(confirm).toBeDisabled();
  await page.getByRole('button', { name: 'Level 2' }).click();
  await confirm.click();
  await page.getByRole('button', { name: 'Tambah Nasi Goreng' }).click();
  await page.getByRole('button', { name: 'Level 2' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Tambah' }).click();
  await page.getByRole('button', { name: 'Tambah Es Teh' }).click();

  // Keranjang
  await page.getByRole('link', { name: /3 item/ }).click();
  await expect(page.getByTestId('cart-item')).toHaveCount(2);
  await expect(page.getByTestId('total')).toHaveText(/55\.000/);
  await page.getByRole('button', { name: 'Lanjut ke Checkout' }).click();

  // Checkout
  await page.getByRole('button', { name: /Bawa Pulang/ }).click();
  await expect(page.getByText('Rp 55.000').first()).toBeVisible();
  await expect(page.getByRole('radio', { name: /QRIS/ })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('radio', { name: /Virtual Account/ })).toBeDisabled();
  await page.getByRole('button', { name: /^Bayar/ }).click();

  // Bayar: QR + countdown, polling → paid → halaman detail dengan QR pesanan
  await expect(page.getByRole('heading', { name: 'Bayar dengan QRIS' })).toBeVisible();
  await expect(page.getByTestId('countdown')).toHaveText(/^1[45]:\d\d$/);
  // Poll #1 saat halaman terbuka, poll #2 dari klik manual → mock jadi 'paid'.
  await page.getByRole('button', { name: 'Cek status pembayaran' }).click();
  await expect(page).toHaveURL(/\/orders\/PSD-261123-0001$/);
  await expect(page.getByText('Tunjukkan QR ini ke kasir')).toBeVisible();
  await expect(page.getByTestId('order-code')).toHaveText('PSD-261123-0001');
  await expect(page.getByText(/Ganti ke Makan di Tempat/)).toBeVisible();
});

test('dine in ditolak saat penuh', async ({ page }) => {
  await mockApi(page, { dineInFull: true });
  await page.addInitScript(() => {
    localStorage.setItem('pesduls_token', 't');
    sessionStorage.setItem('pesduls_splash', '1');
    localStorage.setItem('pesduls_cart', JSON.stringify([{ key: '2:0', menu_id: 2, name: 'Es Teh', price: 5000, image_url: '', qty: 1, spice_level: null, note: '' }]));
  });
  await page.goto('/checkout/type');
  await expect(page.getByText('Tempat makan sedang penuh')).toBeVisible();
  await expect(page.getByRole('button', { name: /Makan di Tempat/ })).toBeDisabled();
});

test('belum login → diarahkan ke /login', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('pesduls_splash', '1'));
  await page.goto('/cart');
  await expect(page).toHaveURL(/\/login$/);
});

const seedCart = () => {
  localStorage.setItem('pesduls_token', 't');
  sessionStorage.setItem('pesduls_splash', '1');
  localStorage.setItem('pesduls_cart', JSON.stringify([{ key: '2:0', menu_id: 2, name: 'Es Teh', price: 5000, image_url: '', qty: 1, spice_level: null, note: '' }]));
};

test('bayar di kasir → langsung ke QR pesanan, tanpa layar QRIS', async ({ page }) => {
  await mockApi(page, { method: 'cashier' });
  await page.addInitScript(seedCart);
  await page.goto('/checkout/type');
  await page.getByRole('button', { name: /Bawa Pulang/ }).click();
  await page.getByRole('radio', { name: /Bayar di Kasir/ }).click();
  await page.getByRole('button', { name: /Pesan, bayar di kasir/ }).click();

  await expect(page).toHaveURL(/\/orders\/PSD-261123-0001$/);
  await expect(page.getByTestId('cashier-banner')).toContainText('55.000');
  await expect(page.getByText(/Tunjukkan QR ini ke kasir/)).toBeVisible();
  await expect(page.getByTestId('order-code')).toHaveText('PSD-261123-0001');
  await expect(page.getByRole('link', { name: 'Lanjut bayar' })).toHaveCount(0);
  await expect(page.getByText(/Ganti ke Makan di Tempat/)).toBeVisible();
});

test('BE lama tanpa payment_methods → hanya QRIS', async ({ page }) => {
  await mockApi(page);
  await page.route('**/api/v1/settings/public', (r) => r.fulfill(ok({ dine_in_full: false })));
  await page.addInitScript(seedCart);
  await page.goto('/checkout/type');
  await page.getByRole('button', { name: /Bawa Pulang/ }).click();
  await expect(page.getByRole('radio')).toHaveCount(1);
  await expect(page.getByRole('radio', { name: /QRIS/ })).toHaveAttribute('aria-checked', 'true');
});
