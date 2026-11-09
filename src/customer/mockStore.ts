import type { MemberProfile, Order, OrderStatus } from "./data";

import { mockOrders } from "./mockOrders";

// =====================================================
// STORAGE KEYS
// =====================================================

export const ORDER_STORAGE_KEY = "MilktyWay-orders";

const MEMBER_STORAGE_KEY = "MilktyWay-member-profile";

// =====================================================
// GENERIC STORAGE READER
// =====================================================

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);

    if (raw === null) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Không thể đọc dữ liệu ${key}:`, error);

    return fallback;
  }
}

const VALID_ORDER_STATUSES: OrderStatus[] = [
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "DELIVERING",
  "COMPLETED",
  "CANCEL_REQUESTED",
  "CANCELLED",
];

function normalizeOrderStatus(value: unknown): OrderStatus {
  if (
    typeof value === "string" &&
    VALID_ORDER_STATUSES.includes(value as OrderStatus)
  ) {
    return value as OrderStatus;
  }

  return "PENDING_CONFIRMATION";
}

// =====================================================
// LOAD ORDERS
// =====================================================

export function loadOrders(): Order[] {
  try {
    const stored = localStorage.getItem(ORDER_STORAGE_KEY);

    // Chỉ khởi tạo mock data khi key chưa từng tồn tại.
    if (stored === null) {
      saveOrders(mockOrders);
      return mockOrders;
    }

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      console.error("Dữ liệu đơn hàng không hợp lệ.");
      return [];
    }

    const rawOrders = parsed as Partial<Order>[];

    return rawOrders.map((order, index) => {
      const createdAt = order.createdAt ?? new Date().toISOString();

      const status = normalizeOrderStatus(order.status);

      const statusHistory =
        Array.isArray(order.statusHistory) && order.statusHistory.length > 0
          ? order.statusHistory
          : [
              {
                status,
                at: createdAt,
                note: "Đơn hàng được khôi phục từ dữ liệu phiên bản cũ.",
              },
            ];

      return {
        id: order.id ?? `IV-${Date.now()}-${index + 1}`,

        createdAt,

        name: order.name ?? "",
        phone: order.phone ?? "",
        address: order.address ?? "",
        note: order.note ?? "",

        branchName: order.branchName ?? "",

        items: Array.isArray(order.items) ? order.items : [],

        subtotal: order.subtotal ?? 0,
        discount: order.discount ?? 0,
        shipping: order.shipping ?? 0,
        total: order.total ?? 0,

        payment: order.payment ?? "Thanh toán khi nhận hàng (COD)",

        status,

        paymentMethod: order.paymentMethod ?? "COD",
        paymentStatus: order.paymentStatus ?? "UNPAID",

        statusHistory,

        actionRequests: Array.isArray(order.actionRequests)
          ? order.actionRequests
          : [],

        complaints: Array.isArray(order.complaints) ? order.complaints : [],
      };
    });
  } catch (error) {
    console.error("Lỗi khi tải danh sách đơn hàng:", error);
    return [];
  }
}

// =====================================================
// SAVE ORDERS
// =====================================================

export function saveOrders(orders: Order[]): boolean {
  try {
    const serialized = JSON.stringify(orders);

    // Tránh ghi lại cùng một nội dung không cần thiết.
    if (localStorage.getItem(ORDER_STORAGE_KEY) !== serialized) {
      localStorage.setItem(ORDER_STORAGE_KEY, serialized);
    }

    return true;
  } catch (error) {
    console.error("Lỗi khi lưu danh sách đơn hàng:", error);
    return false;
  }
}

// =====================================================
// LOAD MEMBER PROFILE
// =====================================================

export function loadMemberProfile(): MemberProfile | null {
  try {
    return readJson<MemberProfile | null>(MEMBER_STORAGE_KEY, null);
  } catch (error) {
    console.error("Lỗi khi tải hồ sơ hội viên:", error);
    return null;
  }
}

// =====================================================
// SAVE MEMBER PROFILE
// =====================================================

export function saveMemberProfile(profile: MemberProfile | null): boolean {
  try {
    if (profile === null) {
      localStorage.removeItem(MEMBER_STORAGE_KEY);
      return true;
    }

    localStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(profile));

    return true;
  } catch (error) {
    console.error("Lỗi khi lưu hồ sơ hội viên:", error);
    return false;
  }
}
