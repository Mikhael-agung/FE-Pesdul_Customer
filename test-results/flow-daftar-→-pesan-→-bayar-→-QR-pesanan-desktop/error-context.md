# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flow.spec.ts >> daftar → pesan → bayar → QR pesanan
- Location: e2e/flow.spec.ts:66:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('splash')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByTestId('splash') with timeout 5000ms
  - waiting for getByTestId('splash')

```

```yaml
- main:
  - heading "PESDUL'S" [level=1]
  - paragraph: Pesan Dulu Bebas Antre
  - link "login Masuk":
    - /url: /login
  - link "person_add Daftar":
    - /url: /register
  - heading "Buat Akun Baru" [level=2]
  - paragraph: Daftar sekali, pesan tanpa antre kapan saja.
  - text: Nama person
  - textbox "Nama":
    - /placeholder: Nama lengkap
  - text: Nomor HP atau Email alternate_email
  - textbox "Nomor HP atau Email":
    - /placeholder: 08123456789 atau email@domain.com
  - text: Kata Sandi lock
  - textbox "Kata Sandi":
    - /placeholder: Minimal 8 karakter
  - button "Tampilkan sandi": visibility
  - text: Ulangi Kata Sandi lock
  - textbox "Ulangi Kata Sandi":
    - /placeholder: Ketik ulang kata sandi
  - button "Tampilkan sandi": visibility
  - button "Daftar Sekarang"
  - text: atau masuk lebih cepat dengan
  - button "Lanjutkan dengan Google. Dibuka di tab baru":
    - img
    - text: Lanjutkan dengan Google
  - iframe
```

# Test source

```ts
  1   | import { expect, test, type Page } from '@playwright/test';
  2   | 
  3   | const API = '**/api/v1';
  4   | const ok = (data: unknown, status = 200) => ({ status, json: { data } });
  5   | 
  6   | const menus = [
  7   |   { id: 1, name: 'Nasi Goreng', price: 25000, image_url: '', category: { id: 1, name: 'Makanan' }, has_spice_level: true, spice_levels: [1, 2, 3], stock_remaining: 20, is_available: true },
  8   |   { id: 2, name: 'Es Teh', price: 5000, image_url: '', category: { id: 2, name: 'Minuman' }, has_spice_level: false, spice_levels: [], stock_remaining: 3, is_available: true },
  9   |   { id: 3, name: 'Soto', price: 20000, image_url: '', category: { id: 1, name: 'Makanan' }, has_spice_level: false, spice_levels: [], stock_remaining: 0, is_available: false },
  10  | ];
  11  | 
  12  | type Opts = { dineInFull?: boolean; method?: 'qris' | 'cashier'; methods?: object[] };
  13  | 
  14  | async function mockApi(page: Page, opts: Opts = {}) {
  15  |   let polls = 0;
  16  |   const order = (status: string, extra: object = {}) => ({
  17  |     code: 'PSD-261123-0001', order_type: 'takeaway', payment_method: opts.method ?? 'qris', status,
  18  |     items: [
  19  |       { menu_id: 1, name: 'Nasi Goreng', qty: 2, unit_price: 25000, spice_level: 2, note: null },
  20  |       { menu_id: 2, name: 'Es Teh', qty: 1, unit_price: 5000, spice_level: null, note: null },
  21  |     ],
  22  |     qr_token: qrFor(status),
  23  |     estimate_minutes: null, can_change_type: status === 'paid' || (opts.method === 'cashier' && status === 'pending_payment'), type_logs: [],
  24  |     payment: { status: status === 'pending_payment' ? 'pending' : 'paid', gross_amount: 55000, qr_string: '000201QRIS', qr_url: null, expires_at: new Date(Date.now() + 15 * 60_000).toISOString() },
  25  |     created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 15 * 60_000).toISOString(), ...extra,
  26  |   });
  27  |   let current = 'pending_payment';
  28  | 
  29  |   const qrFor = (s: string) => s === 'paid' || (opts.method === 'cashier' && s === 'pending_payment') ? opts.method === 'cashier' ? 'TOKEN-CASH' : 'TOKEN-ABC' : null;
  30  | 
  31  |   await page.route(`${API}/auth/register`, (r) => r.fulfill({ status: 201, json: { data: { user: { id: 1, name: 'Agung', identifier: 'a@a.com' }, token: 't' } } }));
  32  |   await page.route(`${API}/auth/me`, (r) => r.fulfill(ok({ id: 1, name: 'Agung', identifier: 'a@a.com' })));
  33  |   await page.route(`${API}/categories`, (r) => r.fulfill(ok([{ id: 1, name: 'Makanan' }, { id: 2, name: 'Minuman' }])));
  34  |   await page.route(`${API}/menus**`, (r) => r.fulfill(ok(menus)));
  35  |   await page.route(`${API}/settings/public`, (r) => r.fulfill(ok({
  36  |     dine_in_full: !!opts.dineInFull,
  37  |     payment_methods: opts.methods ?? [
  38  |       { id: 'qris', label: 'QRIS', enabled: true },
  39  |       { id: 'cashier', label: 'Bayar di Kasir', enabled: true },
  40  |       { id: 'va', label: 'Virtual Account', enabled: false },
  41  |     ],
  42  |   })));
  43  |   await page.route(`${API}/cart/validate`, async (r) => {
  44  |     const items = r.request().postDataJSON().items as { menu_id: number; qty: number }[];
  45  |     const price: Record<number, number> = { 1: 25000, 2: 5000 };
  46  |     await r.fulfill(ok({ valid: true, total: items.reduce((s, i) => s + price[i.menu_id] * i.qty, 0), items: items.map((i) => ({ menu_id: i.menu_id, unit_price: price[i.menu_id], qty: i.qty, available: true, stock_remaining: 10 })) }));
  47  |   });
  48  |   await page.route(`${API}/orders`, (r) => {
  49  |     if (r.request().method() === 'POST') {
  50  |       const body = r.request().postDataJSON();
  51  |       expect(body.order_type).toBe('takeaway');
  52  |       expect(body.payment_method).toBe(opts.method ?? 'qris');
  53  |       const extra = opts.method === 'cashier' ? { qr_token: 'TOKEN-CASH', payment: null } : {};
  54  |       return r.fulfill(ok(order('pending_payment', extra), 201));
  55  |     }
  56  |     return r.fulfill({ json: { data: [], meta: { current_page: 1, per_page: 10, total: 0, last_page: 1 } } });
  57  |   });
  58  |   await page.route(`${API}/orders/PSD-261123-0001`, (r) => r.fulfill(ok(order(current))));
  59  |   await page.route(`${API}/orders/PSD-261123-0001/payment/status`, (r) => {
  60  |     polls++;
  61  |     if (polls >= 2) current = 'paid'; // "settlement" setelah poll ke-2
  62  |     return r.fulfill(ok({ order_status: current, payment: order(current).payment }));
  63  |   });
  64  | }
  65  | 
  66  | test('daftar → pesan → bayar → QR pesanan', async ({ page }) => {
  67  |   await mockApi(page);
  68  |   await page.goto('/register');
> 69  |   await expect(page.getByTestId('splash')).toBeVisible();
      |                                            ^ Error: expect(locator).toBeVisible() failed
  70  |   await page.getByLabel('Nama').fill('Agung');
  71  |   await page.getByLabel('Nomor HP atau Email').fill('a@a.com');
  72  |   await page.getByLabel('Kata Sandi', { exact: true }).fill('password123');
  73  |   await page.getByLabel('Ulangi Kata Sandi').fill('password123');
  74  |   await page.getByRole('button', { name: 'Daftar Sekarang' }).click();
  75  | 
  76  |   // Menu
  77  |   await expect(page.getByTestId('menu-card')).toHaveCount(3);
  78  |   await expect(page.getByText('Habis', { exact: true })).toBeVisible();
  79  |   await expect(page.getByRole('button', { name: 'Tambah Soto' })).toBeDisabled();
  80  | 
  81  |   // Menu pedas → sheet wajib pilih level
  82  |   await page.getByRole('button', { name: 'Tambah Nasi Goreng' }).click();
  83  |   const confirm = page.getByRole('dialog').getByRole('button', { name: 'Tambah' });
  84  |   await expect(confirm).toBeDisabled();
  85  |   await page.getByRole('button', { name: 'Level 2' }).click();
  86  |   await confirm.click();
  87  |   await page.getByRole('button', { name: 'Tambah Nasi Goreng' }).click();
  88  |   await page.getByRole('button', { name: 'Level 2' }).click();
  89  |   await page.getByRole('dialog').getByRole('button', { name: 'Tambah' }).click();
  90  |   await page.getByRole('button', { name: 'Tambah Es Teh' }).click();
  91  | 
  92  |   // Keranjang
  93  |   await page.getByRole('link', { name: /3 item/ }).click();
  94  |   await expect(page.getByTestId('cart-item')).toHaveCount(2);
  95  |   await expect(page.getByTestId('total')).toHaveText(/55\.000/);
  96  |   await page.getByRole('button', { name: 'Lanjut ke Checkout' }).click();
  97  | 
  98  |   // Checkout
  99  |   await page.getByRole('button', { name: /Bawa Pulang/ }).click();
  100 |   await expect(page.getByText('Rp 55.000').first()).toBeVisible();
  101 |   await expect(page.getByRole('radio', { name: /QRIS/ })).toHaveAttribute('aria-checked', 'true');
  102 |   await expect(page.getByRole('radio', { name: /Virtual Account/ })).toBeDisabled();
  103 |   await page.getByRole('button', { name: /^Bayar/ }).click();
  104 | 
  105 |   // Bayar: QR + countdown, polling → paid → halaman detail dengan QR pesanan
  106 |   await expect(page.getByRole('heading', { name: 'Bayar dengan QRIS' })).toBeVisible();
  107 |   await expect(page.getByTestId('countdown')).toHaveText(/^1[45]:\d\d$/);
  108 |   // Poll #1 saat halaman terbuka, poll #2 dari klik manual → mock jadi 'paid'.
  109 |   await page.getByRole('button', { name: 'Cek status pembayaran' }).click();
  110 |   await expect(page).toHaveURL(/\/orders\/PSD-261123-0001$/);
  111 |   await expect(page.getByText('Tunjukkan QR ini ke kasir')).toBeVisible();
  112 |   await expect(page.getByTestId('order-code')).toHaveText('PSD-261123-0001');
  113 |   await expect(page.getByText(/Ganti ke Makan di Tempat/)).toBeVisible();
  114 | });
  115 | 
  116 | test('dine in ditolak saat penuh', async ({ page }) => {
  117 |   await mockApi(page, { dineInFull: true });
  118 |   await page.addInitScript(() => {
  119 |     localStorage.setItem('pesduls_token', 't');
  120 |     sessionStorage.setItem('pesduls_splash', '1');
  121 |     localStorage.setItem('pesduls_cart', JSON.stringify([{ key: '2:0', menu_id: 2, name: 'Es Teh', price: 5000, image_url: '', qty: 1, spice_level: null, note: '' }]));
  122 |   });
  123 |   await page.goto('/checkout/type');
  124 |   await expect(page.getByText('Tempat makan sedang penuh')).toBeVisible();
  125 |   await expect(page.getByRole('button', { name: /Makan di Tempat/ })).toBeDisabled();
  126 | });
  127 | 
  128 | test('belum login → diarahkan ke /login', async ({ page }) => {
  129 |   await page.addInitScript(() => sessionStorage.setItem('pesduls_splash', '1'));
  130 |   await page.goto('/cart');
  131 |   await expect(page).toHaveURL(/\/login$/);
  132 | });
  133 | 
  134 | const seedCart = () => {
  135 |   localStorage.setItem('pesduls_token', 't');
  136 |   sessionStorage.setItem('pesduls_splash', '1');
  137 |   localStorage.setItem('pesduls_cart', JSON.stringify([{ key: '2:0', menu_id: 2, name: 'Es Teh', price: 5000, image_url: '', qty: 1, spice_level: null, note: '' }]));
  138 | };
  139 | 
  140 | test('bayar di kasir → langsung ke QR pesanan, tanpa layar QRIS', async ({ page }) => {
  141 |   await mockApi(page, { method: 'cashier' });
  142 |   await page.addInitScript(seedCart);
  143 |   await page.goto('/checkout/type');
  144 |   await page.getByRole('button', { name: /Bawa Pulang/ }).click();
  145 |   await page.getByRole('radio', { name: /Bayar di Kasir/ }).click();
  146 |   await page.getByRole('button', { name: /Pesan, bayar di kasir/ }).click();
  147 | 
  148 |   await expect(page).toHaveURL(/\/orders\/PSD-261123-0001$/);
  149 |   await expect(page.getByTestId('cashier-banner')).toContainText('55.000');
  150 |   await expect(page.getByText(/Tunjukkan QR ini ke kasir/)).toBeVisible();
  151 |   await expect(page.getByTestId('order-code')).toHaveText('PSD-261123-0001');
  152 |   await expect(page.getByRole('link', { name: 'Lanjut bayar' })).toHaveCount(0);
  153 |   await expect(page.getByText(/Ganti ke Makan di Tempat/)).toBeVisible();
  154 | });
  155 | 
  156 | test('BE lama tanpa payment_methods → hanya QRIS', async ({ page }) => {
  157 |   await mockApi(page);
  158 |   await page.route('**/api/v1/settings/public', (r) => r.fulfill(ok({ dine_in_full: false })));
  159 |   await page.addInitScript(seedCart);
  160 |   await page.goto('/checkout/type');
  161 |   await page.getByRole('button', { name: /Bawa Pulang/ }).click();
  162 |   await expect(page.getByRole('radio')).toHaveCount(1);
  163 |   await expect(page.getByRole('radio', { name: /QRIS/ })).toHaveAttribute('aria-checked', 'true');
  164 | });
  165 | 
```