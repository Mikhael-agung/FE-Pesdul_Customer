export type OrderType = 'dine_in' | 'takeaway';
export type OrderStatus = 'pending_payment' | 'paid' | 'cooking' | 'done' | 'picked_up' | 'expired';

export type Category = { id: number; name: string };

export type Menu = {
    id: number;
    name: string;
    price: number;
    image_url: string;
    category: Category | null;
    has_spice_level: boolean;
    spice_levels: number[];
    stock_remaining: number;
    is_available: boolean;
};

export type CartItemInput = {
    menu_id: number;
    qty: number;
    spice_level?: number | null;
    note?: string | null;
};

export type OrderItem = {
    menu_id: number;
    name: string;
    qty: number;
    unit_price: number;
    spice_level: number | null;
    note: string | null;
};

export type Payment = {
    status: 'pending' | 'paid' | 'failed' | 'expired';
    gross_amount: number;
    qr_string: string;
    qr_url: string | null;
    expires_at: string;
};

export type Order = {
    code: string;
    order_type: OrderType;
    status: OrderStatus;
    status_label: string;
    total: number;
    items: OrderItem[];
    qr_token: string | null;
    estimate_minutes: number | null;
    can_change_type: boolean;
    type_logs: { old_type: OrderType; new_type: OrderType; changed_at: string }[];
    payment: Payment | null;
    created_at: string;
    expires_at: string;
};

export type OrderSummary = Pick<
    Order,
    'code' | 'status' | 'status_label' | 'order_type' | 'total' | 'created_at'
>;

export type PageMeta = { current_page: number; per_page: number; total: number; last_page: number };
