import type {
  CartItem,
  Order,
  OrderActionRequest,
  OrderComplaint,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "./data";

import { products } from "./data";

// =====================================================
// MOCK ORDER TYPES
// =====================================================

type MockItemSeed = {
  productId: number;
  quantity: number;
  size?: string;
  sugar?: string;
  ice?: string;
  toppings?: string[];
  unitPrice?: number;
};

type MockStatusHistorySeed = {
  status: OrderStatus;
  note: string;
};

type MockOrderSeed = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  address: string;
  note?: string;
  branchName: string;

  items: MockItemSeed[];

  discount?: number;
  shipping?: number;

  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;

  statusHistory: MockStatusHistorySeed[];

  actionRequests?: OrderActionRequest[];
  complaints?: OrderComplaint[];
};

// =====================================================
// PAYMENT LABELS
// =====================================================

const paymentMethodLabels: Record<PaymentMethod, string> = {
  COD: "Thanh toán khi nhận hàng (COD)",
  MOMO: "Ví MoMo (demo)",
  BANK_TRANSFER: "Chuyển khoản ngân hàng (demo)",
};

// =====================================================
// CREATE MOCK CART ITEM
// =====================================================

const createMockItem = (
  orderId: string,
  index: number,
  seed: MockItemSeed,
): CartItem => {
  const product = products.find(
    (item) => item.id === seed.productId,
  );

  if (!product) {
    throw new Error(
      `Không tìm thấy sản phẩm có ID ${seed.productId}`,
    );
  }

  const size = seed.size ?? "M";
  const sugar = seed.sugar ?? "50%";
  const ice = seed.ice ?? "50%";

  const toppings = seed.toppings ?? [];

  const toppingCost = toppings.reduce(
    (sum, topping) =>
      sum + (topping === "Trân châu đen" ? 5000 : 7000),
    0,
  );

  // Đồng bộ cách tính giá với App.tsx.
  const unitPrice =
    seed.unitPrice ??
    product.price +
      (size === "L" ? 6000 : 0) +
      toppingCost;

  const detail =
    `${size} · ${sugar} đường · ${ice}` +
    (toppings.length
      ? ` · ${toppings.join(", ")}`
      : "");

  return {
    id: `${orderId}-ITEM-${index + 1}`,
    productId: product.id,
    name: product.name,
    image: product.image,
    detail,
    size,
    sugar,
    ice,
    toppings,
    unitPrice,
    quantity: seed.quantity,
    selected: true,
  };
};

// =====================================================
// CREATE COMPLETE MOCK ORDER
// =====================================================

const createMockOrder = (seed: MockOrderSeed): Order => {
  const items = seed.items.map((item, index) =>
    createMockItem(seed.id, index, item),
  );

  // Tổng tiền sản phẩm.
  const subtotal = items.reduce(
    (sum, item) =>
      sum + item.unitPrice * item.quantity,
    0,
  );

  const discount = seed.discount ?? 0;

  // Đồng bộ với quy tắc phí giao hàng trong App.tsx.
  const shipping =
    seed.shipping ??
    (subtotal === 0 || subtotal >= 150000 ? 0 : 15000);

  if (discount < 0 || discount > subtotal) {
    throw new Error(
      `Giảm giá không hợp lệ ở đơn hàng ${seed.id}`,
    );
  }

  const total = subtotal - discount + shipping;

  // Tạo timeline theo thứ tự thời gian.
  // Mỗi bước cách nhau 10 phút.
  if (seed.statusHistory.length === 0) {
    throw new Error(
      `Đơn hàng ${seed.id} chưa có lịch sử trạng thái.`,
    );
  }

  const statusHistory = seed.statusHistory.map(
    (item, index) => ({
      status: item.status,
      at: new Date(
        new Date(seed.createdAt).getTime() +
          index * 10 * 60 * 1000,
      ).toISOString(),
      note: item.note,
    }),
  );

  // Trạng thái hiện tại luôn là trạng thái cuối timeline.
  const status =
    statusHistory[statusHistory.length - 1].status;

  return {
    id: seed.id,
    createdAt: seed.createdAt,

    name: seed.name,
    phone: seed.phone,
    address: seed.address,
    note: seed.note ?? "",

    branchName: seed.branchName,

    items,

    subtotal,
    discount,
    shipping,
    total,

    payment: paymentMethodLabels[seed.paymentMethod],
    paymentMethod: seed.paymentMethod,
    paymentStatus: seed.paymentStatus,

    status,
    statusHistory,

    actionRequests: seed.actionRequests ?? [],
    complaints: seed.complaints ?? [],
  };
};

// =====================================================
// MOCK ORDERS
// Đủ 8 trạng thái nghiệp vụ của dự án.
// =====================================================

export const mockOrders: Order[] = [

  // ---------------------------------------------------
  // 01. PENDING_CONFIRMATION
  // Khách vừa đặt đơn, cửa hàng chưa xác nhận.
  // ---------------------------------------------------

  createMockOrder({
    id: "IV-90000001",
    createdAt: "2026-11-08T09:00:00+07:00",

    name: "Nguyễn Minh Anh",
    phone: "0901111111",
    address: "Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
    note: "Vui lòng gọi trước khi giao.",

    branchName: "MilktyWay – Quận 1",

    items: [
      {
        productId: 1,
        quantity: 1,
        size: "M",
        sugar: "50%",
        ice: "50%",
      },
    ],

    paymentMethod: "COD",
    paymentStatus: "UNPAID",

    statusHistory: [
      {
        status: "PENDING_CONFIRMATION",
        note: "Đơn hàng đã được tạo. Đang chờ cửa hàng xác nhận.",
      },
    ],
  }),

  // ---------------------------------------------------
  // 02. CONFIRMED
  // Cửa hàng đã xác nhận đơn hàng.
  // ---------------------------------------------------

  createMockOrder({
    id: "IV-90000002",
    createdAt: "2026-11-08T08:00:00+07:00",

    name: "Nguyễn Minh Anh",
    phone: "0901111111",
    address: "Điện Biên Phủ, Quận 3, TP. Hồ Chí Minh",
    note: "Giao tại quầy lễ tân.",

    branchName: "MilktyWay – Quận 3",

    items: [
      {
        productId: 7,
        quantity: 2,
        size: "M",
        sugar: "70%",
        ice: "50%",
      },
      {
        productId: 2,
        quantity: 1,
        size: "M",
        sugar: "50%",
        ice: "30%",
      },
    ],

    paymentMethod: "MOMO",
    paymentStatus: "PAID",

    statusHistory: [
      {
        status: "PENDING_CONFIRMATION",
        note: "Đơn hàng đã được tạo.",
      },
      {
        status: "CONFIRMED",
        note: "Cửa hàng đã xác nhận đơn hàng.",
      },
    ],

    actionRequests: [
      {
        id: "REQ-MOCK-002",
        type: "CHANGE",
        reason: "Khách từng yêu cầu thay đổi mức đường.",
        createdAt: "2026-11-08T08:15:00+07:00",
        requestStatus: "REJECTED",
      },
    ],
  }),

  // ---------------------------------------------------
  // 03. PREPARING
  // Đơn đang được pha chế.
  // ---------------------------------------------------

  createMockOrder({
    id: "IV-90000003",
    createdAt: "2026-11-08T07:10:00+07:00",

    name: "Trần Quốc Bảo",
    phone: "0902222222",
    address: "Võ Văn Tần, Quận 3, TP. Hồ Chí Minh",

    branchName: "MilktyWay – Quận 3",

    items: [
      {
        productId: 3,
        quantity: 2,
        size: "M",
        sugar: "30%",
        ice: "50%",
      },
    ],

    paymentMethod: "COD",
    paymentStatus: "UNPAID",

    statusHistory: [
      {
        status: "PENDING_CONFIRMATION",
        note: "Đơn hàng đã được tạo.",
      },
      {
        status: "CONFIRMED",
        note: "Cửa hàng đã xác nhận đơn hàng.",
      },
      {
        status: "PREPARING",
        note: "Cửa hàng bắt đầu pha chế.",
      },
    ],
  }),

  // ---------------------------------------------------
  // 04. READY
  // Đơn đã pha chế xong.
  // ---------------------------------------------------

  createMockOrder({
    id: "IV-90000004",
    createdAt: "2026-11-08T06:00:00+07:00",

    name: "Trần Quốc Bảo",
    phone: "0902222222",
    address: "Nguyễn Văn Trỗi, Phú Nhuận, TP. Hồ Chí Minh",

    branchName: "MilktyWay – Quận 1",

    items: [
      {
        productId: 9,
        quantity: 1,
        size: "M",
        sugar: "70%",
        ice: "30%",
      },
      {
        productId: 7,
        quantity: 1,
        size: "L",
        sugar: "50%",
        ice: "50%",
      },
    ],

    paymentMethod: "BANK_TRANSFER",
    paymentStatus: "PENDING",

    statusHistory: [
      {
        status: "PENDING_CONFIRMATION",
        note: "Đơn hàng đã được tạo.",
      },
      {
        status: "CONFIRMED",
        note: "Cửa hàng đã xác nhận đơn hàng.",
      },
      {
        status: "PREPARING",
        note: "Cửa hàng bắt đầu pha chế.",
      },
      {
        status: "READY",
        note: "Đơn hàng đã pha chế xong.",
      },
    ],
  }),

  // ---------------------------------------------------
  // 05. DELIVERING
  // Đơn đang giao tới khách.
  // ---------------------------------------------------

  createMockOrder({
    id: "IV-90000005",
    createdAt: "2026-11-08T04:30:00+07:00",

    name: "Lê Hoàng Yến",
    phone: "0903333333",
    address: "Xô Viết Nghệ Tĩnh, Bình Thạnh, TP. Hồ Chí Minh",

    branchName: "MilktyWay – Bình Thạnh",

    items: [
      {
        productId: 4,
        quantity: 2,
        size: "M",
        sugar: "50%",
        ice: "30%",
      },
    ],

    paymentMethod: "COD",
    paymentStatus: "UNPAID",

    statusHistory: [
      {
        status: "PENDING_CONFIRMATION",
        note: "Đơn hàng đã được tạo.",
      },
      {
        status: "CONFIRMED",
        note: "Cửa hàng đã xác nhận đơn hàng.",
      },
      {
        status: "PREPARING",
        note: "Cửa hàng bắt đầu pha chế.",
      },
      {
        status: "READY",
        note: "Đơn hàng đã pha chế xong.",
      },
      {
        status: "DELIVERING",
        note: "Đơn hàng đang được giao đến khách hàng.",
      },
    ],
  }),

  // ---------------------------------------------------
  // 06. COMPLETED
  // Đơn đã giao hoàn tất.
  // ---------------------------------------------------

  createMockOrder({
    id: "IV-90000006",
    createdAt: "2026-11-07T10:00:00+07:00",

    name: "Lê Hoàng Yến",
    phone: "0903333333",
    address: "Phan Xích Long, Phú Nhuận, TP. Hồ Chí Minh",

    branchName: "MilktyWay – Quận 1",

    items: [
      {
        productId: 1,
        quantity: 2,
        size: "M",
        sugar: "50%",
        ice: "50%",
      },
      {
        productId: 7,
        quantity: 1,
        size: "M",
        sugar: "70%",
        ice: "30%",
      },
    ],

    paymentMethod: "MOMO",
    paymentStatus: "PAID",

    statusHistory: [
      {
        status: "PENDING_CONFIRMATION",
        note: "Đơn hàng đã được tạo.",
      },
      {
        status: "CONFIRMED",
        note: "Cửa hàng đã xác nhận đơn hàng.",
      },
      {
        status: "PREPARING",
        note: "Cửa hàng bắt đầu pha chế.",
      },
      {
        status: "READY",
        note: "Đơn hàng đã pha chế xong.",
      },
      {
        status: "DELIVERING",
        note: "Đơn hàng đang được giao đến khách hàng.",
      },
      {
        status: "COMPLETED",
        note: "Đơn hàng đã được giao hoàn tất.",
      },
    ],

    complaints: [
      {
        id: "COMPLAINT-MOCK-001",
        category: "Chất lượng sản phẩm",
        description: "Khách muốn góp ý về mức độ ngọt của đồ uống.",
        createdAt: "2026-11-07T11:30:00+07:00",
        complaintStatus: "RESOLVED",
      },
    ],
  }),

  // ---------------------------------------------------
  // 07. CANCEL_REQUESTED
  // Khách đã gửi yêu cầu hủy, cửa hàng chưa xử lý.
  // ---------------------------------------------------

  createMockOrder({
    id: "IV-90000007",
    createdAt: "2026-11-08T09:30:00+07:00",

    name: "Phạm Gia Hân",
    phone: "0904444444",
address: "Xô Viết Nghệ Tĩnh, Bình Thạnh, TP. Hồ Chí Minh",

branchName: "MilktyWay – Bình Thạnh",
    items: [
      {
        productId: 6,
        quantity: 1,
        size: "M",
        sugar: "30%",
        ice: "50%",
      },
    ],

    paymentMethod: "COD",
    paymentStatus: "UNPAID",

    statusHistory: [
      {
        status: "PENDING_CONFIRMATION",
        note: "Đơn hàng đã được tạo.",
      },
      {
        status: "CONFIRMED",
        note: "Cửa hàng đã xác nhận đơn hàng.",
      },
      {
        status: "CANCEL_REQUESTED",
        note: "Khách hàng đã gửi yêu cầu hủy đơn.",
      },
    ],

    actionRequests: [
      {
        id: "REQ-MOCK-007",
        type: "CANCEL",
        reason: "Khách đặt nhầm chi nhánh.",
        createdAt: "2026-11-08T09:50:00+07:00",
        requestStatus: "PENDING",
      },
    ],
  }),

  // ---------------------------------------------------
  // 08. CANCELLED
  // Cửa hàng đã xác nhận hủy đơn.
  // ---------------------------------------------------

  createMockOrder({
    id: "IV-90000008",
    createdAt: "2026-11-07T08:30:00+07:00",

    name: "Phạm Gia Hân",
    phone: "0904444444",
    address: "Hai Bà Trưng, Quận 1, TP. Hồ Chí Minh",

    branchName: "MilktyWay – Quận 1",

    items: [
      {
        productId: 2,
        quantity: 1,
        size: "M",
        sugar: "50%",
        ice: "50%",
      },
    ],

    paymentMethod: "MOMO",
    paymentStatus: "REFUND_PENDING",

    statusHistory: [
      {
        status: "PENDING_CONFIRMATION",
        note: "Đơn hàng đã được tạo.",
      },
      {
        status: "CONFIRMED",
        note: "Cửa hàng đã xác nhận đơn hàng.",
      },
      {
        status: "CANCEL_REQUESTED",
        note: "Khách hàng đã gửi yêu cầu hủy đơn.",
      },
      {
        status: "CANCELLED",
        note: "Cửa hàng đã xác nhận hủy đơn.",
      },
    ],

    actionRequests: [
      {
        id: "REQ-MOCK-008",
        type: "CANCEL",
        reason: "Khách hàng có việc đột xuất.",
        createdAt: "2026-11-07T09:00:00+07:00",
        requestStatus: "APPROVED",
      },
    ],
  }),
];