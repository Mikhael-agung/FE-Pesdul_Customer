# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flow.spec.ts >> bayar di kasir → langsung ke QR pesanan, tanpa layar QRIS
- Location: e2e/flow.spec.ts:140:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByTestId('cashier-banner')
Expected substring: "55.000"
Received string:    "Bayar di kasirRp NaNDatang ke restoran dan bayar sebelum 14:56"
Timeout: 5000ms

Call log:
  - Expect "toContainText" getByTestId('cashier-banner') with timeout 5000ms
  - waiting for getByTestId('cashier-banner')
    6 × locator resolved to <div data-testid="cashier-banner" class="mb-3 rounded-2xl bg-secondary-fixed p-4 text-center">…</div>
      - unexpected value "Bayar di kasirRp NaNDatang ke restoran dan bayar sebelum 15:00"
    2 × locator resolved to <div data-testid="cashier-banner" class="mb-3 rounded-2xl bg-secondary-fixed p-4 text-center">…</div>
      - unexpected value "Bayar di kasirRp NaNDatang ke restoran dan bayar sebelum 14:59"
    2 × locator resolved to <div data-testid="cashier-banner" class="mb-3 rounded-2xl bg-secondary-fixed p-4 text-center">…</div>
      - unexpected value "Bayar di kasirRp NaNDatang ke restoran dan bayar sebelum 14:58"
    2 × locator resolved to <div data-testid="cashier-banner" class="mb-3 rounded-2xl bg-secondary-fixed p-4 text-center">…</div>
      - unexpected value "Bayar di kasirRp NaNDatang ke restoran dan bayar sebelum 14:57"
    2 × locator resolved to <div data-testid="cashier-banner" class="mb-3 rounded-2xl bg-secondary-fixed p-4 text-center">…</div>
      - unexpected value "Bayar di kasirRp NaNDatang ke restoran dan bayar sebelum 14:56"

```

```yaml
- paragraph: Bayar di kasir
- paragraph: Rp NaN
- paragraph: Datang ke restoran dan bayar sebelum 14:56
```

# Test source

```ts
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
  69  |   await expect(page.getByTestId('splash')).toBeVisible();
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
> 149 |   await expect(page.getByTestId('cashier-banner')).toContainText('55.000');
      |                                                    ^ Error: expect(locator).toContainText(expected) failed
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