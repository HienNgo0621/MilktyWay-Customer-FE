import type { MemberProfile, Order } from "./data";

const ORDER_STORAGE_KEY = "MilktyWay-orders";
const MEMBER_STORAGE_KEY = "MilktyWay-member-profile";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Không thể đọc dữ liệu ${key}:`, error);
    return fallback;
  }
}

export function loadOrders(): Order[] {
  try {
    const rawOrders = readJson<Partial<Order>[]>(ORDER_STORAGE_KEY, []);

    if (!Array.isArray(rawOrders)) {
      return [];
    }

    return rawOrders.map((order) => {
      const createdAt = order.createdAt ?? new Date().toISOString();
      const status = order.status ?? "PENDING_CONFIRMATION";

      return {
        id: order.id ?? `IV-${Date.now()}`,
        createdAt,
        name: order.name ?? "",
        phone: order.phone ?? "",
        address: order.address ?? "",
        note: order.note ?? "",
        branchName: order.branchName ?? "",
        items: order.items ?? [],
        subtotal: order.subtotal ?? 0,
        discount: order.discount ?? 0,
        shipping: order.shipping ?? 0,
        total: order.total ?? 0,
        payment: order.payment ?? "Thanh toán khi nhận hàng (COD)",
        status,
        paymentMethod: order.paymentMethod ?? "COD",
        paymentStatus: order.paymentStatus ?? "UNPAID",
        statusHistory: order.statusHistory ?? [
          {
            status,
            at: createdAt,
            note: "Đơn hàng được khôi phục từ dữ liệu phiên bản cũ.",
          },
        ],
        actionRequests: order.actionRequests ?? [],
        complaints: order.complaints ?? [],
      };
    });
  } catch (error) {
    console.error("Lỗi khi tải danh sách đơn hàng:", error);
    return [];
  }
}

export function saveOrders(orders: Order[]): boolean {
  try {
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
    return true;
  } catch (error) {
    console.error("Lỗi khi lưu danh sách đơn hàng:", error);
    return false;
  }
}

export function loadMemberProfile(): MemberProfile | null {
  try {
    return readJson<MemberProfile | null>(MEMBER_STORAGE_KEY, null);
  } catch (error) {
    console.error("Lỗi khi tải hồ sơ hội viên:", error);
    return null;
  }
}

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
