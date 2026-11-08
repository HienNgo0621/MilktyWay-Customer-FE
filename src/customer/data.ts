export type Category = "milk-tea" | "fruit-tea" | "seasonal" | "combo";
export type Product = {
  id: number;
  sku: string;
  name: string;
  price: number;
  category: Category;
  image: string;
  description: string;
  stock: number;
  badge?: string;
  allowLarge?: boolean;
};
export type Branch = {
  id: string;
  name: string;
  area: string;
  address: string;
  open: boolean;
  unavailable: number[];
};
export type CartItem = {
  id: string;
  productId: number;
  name: string;
  image: string;
  detail: string;
  size: string;
  sugar: string;
  ice: string;
  toppings: string[];
  unitPrice: number;
  quantity: number;
  selected: boolean;
};
export type Customer = { name: string; phone: string; email?: string };
export type OrderStatus =
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "DELIVERING"
  | "COMPLETED"
  | "CANCEL_REQUESTED"
  | "CANCELLED";

export type PaymentMethod = "COD" | "MOMO" | "BANK_TRANSFER";

export type PaymentStatus =
  | "UNPAID"
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUND_PENDING"
  | "REFUNDED";

export type OrderStatusLog = {
  status: OrderStatus;
  at: string;
  note: string;
};

export type OrderActionRequest = {
  id: string;
  type: "CHANGE" | "CANCEL";
  reason: string;
  createdAt: string;
  requestStatus: "PENDING" | "APPROVED" | "REJECTED";
};

export type OrderComplaint = {
  id: string;
  category: string;
  description: string;
  createdAt: string;
  complaintStatus: "OPEN" | "PROCESSING" | "RESOLVED";
};

export type MemberTier = "BRONZE" | "SILVER" | "GOLD" | "VIP";

export type MemberProfile = {
  id: string;
  name: string;
  phone: string;
  email: string;
  points: number;
  tier: MemberTier;
  discountPercent: number;
  joinedAt: string;
};

export type Promotion = {
  id: string;
  name: string;
  description: string;
  code: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  minimumOrder: number;
  maximumDiscount: number;
  startDate: string;
  endDate: string;
  memberOnly: boolean;
  active: boolean;
};

export type Order = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  address: string;
  note: string;
  branchName: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  payment: string;

  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  statusHistory: OrderStatusLog[];
  actionRequests: OrderActionRequest[];
  complaints: OrderComplaint[];
};

export const products: Product[] = [
  {
    id: 1,
    sku: "TS01",
    name: "Trà sữa trân châu",
    price: 39000,
    category: "milk-tea",
    image:
      "https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=720&q=85",
    description: "Trà đậm vị kết hợp sữa tươi béo nhẹ và trân châu dai mềm.",
    stock: 45,
    badge: "Bán chạy",
    allowLarge: true,
  },
  {
    id: 2,
    sku: "TS02",
    name: "Trà sữa ô long",
    price: 39000,
    category: "milk-tea",
    image:
      "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=720&q=85",
    description: "Hương ô long rang thơm dịu, hậu vị thanh.",
    stock: 35,
  },
  {
    id: 3,
    sku: "TS03",
    name: "Trà sữa matcha",
    price: 45000,
    category: "milk-tea",
    image:
      "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=720&q=85",
    description: "Matcha thơm dịu, cân bằng cùng sữa.",
    stock: 30,
    badge: "Được yêu thích",
  },
  {
    id: 4,
    sku: "TS04",
    name: "Trà sữa khoai môn",
    price: 42000,
    category: "milk-tea",
    image:
      "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=720&q=85",
    description: "Vị khoai môn bùi béo, ngọt dịu.",
    stock: 28,
  },
  {
    id: 5,
    sku: "TS05",
    name: "Trà sữa chocolate",
    price: 42000,
    category: "milk-tea",
    image:
      "https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=720&q=85",
    description: "Chocolate thơm đậm, dành cho tín đồ vị cacao.",
    stock: 32,
  },
  {
    id: 6,
    sku: "TS06",
    name: "Trà sữa đường đen",
    price: 45000,
    category: "milk-tea",
    image:
      "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=720&q=85",
    description: "Đường đen caramel thơm cùng sữa tươi.",
    stock: 25,
  },
  {
    id: 7,
    sku: "TT01",
    name: "Trà đào",
    price: 35000,
    category: "fruit-tea",
    image:
      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=720&q=85",
    description: "Trà thanh mát với hương đào dịu nhẹ.",
    stock: 40,
    badge: "Tươi mát",
  },
  {
    id: 8,
    sku: "TT02",
    name: "Trà vải",
    price: 35000,
    category: "fruit-tea",
    image:
      "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=720&q=85",
    description: "Vị vải ngọt thanh và hương trà nhẹ.",
    stock: 36,
  },
  {
    id: 9,
    sku: "TT03",
    name: "Trà chanh dây",
    price: 35000,
    category: "fruit-tea",
    image:
      "https://images.unsplash.com/photo-1513558161293-cfaf765edfd4?auto=format&fit=crop&w=720&q=85",
    description: "Chua ngọt tự nhiên, sảng khoái.",
    stock: 30,
  },
  {
    id: 10,
    sku: "TT04",
    name: "Trà xoài",
    price: 39000,
    category: "fruit-tea",
    image:
      "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=720&q=85",
    description: "Xoài thơm ngọt kết hợp trà thanh.",
    stock: 24,
  },
  {
    id: 11,
    sku: "MM01",
    name: "Trà dâu hibiscus",
    price: 42000,
    category: "seasonal",
    image:
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=720&q=85",
    description: "Hibiscus chua nhẹ cùng vị dâu.",
    stock: 18,
    badge: "Theo mùa",
  },
  {
    id: 12,
    sku: "MM02",
    name: "Trà sen nhãn",
    price: 45000,
    category: "seasonal",
    image:
      "https://images.unsplash.com/photo-1547595628-c61a29f496f0?auto=format&fit=crop&w=720&q=85",
    description: "Hương sen thanh tao kết hợp nhãn.",
    stock: 20,
  },
  {
    id: 101,
    sku: "CB01",
    name: "Combo đôi · 2 trà sữa M",
    price: 69000,
    category: "combo",
    image:
      "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=720&q=85",
    description: "Hai ly trà sữa cho một cuộc hẹn.",
    stock: 20,
    badge: "Tiết kiệm",
  },
  {
    id: 102,
    sku: "CB02",
    name: "Combo tươi mát · 2 trà đào M",
    price: 62000,
    category: "combo",
    image:
      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=720&q=85",
    description: "Hai ly trà đào mát lạnh.",
    stock: 20,
  },
];

export const branches: Branch[] = [
  {
    id: "q1",
    name: "MilktyWay – Quận 1",
    area: "Quận 1",
    address: "Khu vực trung tâm Quận 1, TP. Hồ Chí Minh",
    open: true,
    unavailable: [3, 8],
  },
  {
    id: "q3",
    name: "MilktyWay – Quận 3",
    area: "Quận 3",
    address: "Khu vực Lê Văn Sỹ, Quận 3, TP. Hồ Chí Minh",
    open: true,
    unavailable: [1, 6],
  },
  {
    id: "bt",
    name: "MilktyWay – Bình Thạnh",
    area: "Bình Thạnh",
    address: "Khu vực Bình Thạnh, TP. Hồ Chí Minh",
    open: true,
    unavailable: [7, 12],
  },
];
export const categoryLabels: Record<Category | "all", string> = {
  all: "Tất cả",
  "milk-tea": "Trà sữa",
  "fruit-tea": "Trà trái cây",
  seasonal: "Theo mùa",
  combo: "Combo",
};
export const money = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
export const availableAt = (branch: Branch | null, productId: number) => {
  if (!branch) return false;
  const ingredients =
    productId === 101 ? [1] : productId === 102 ? [7] : [productId];
  return ingredients.every((id) => !branch.unavailable.includes(id));
};

export const demoPromotions: Promotion[] = [
  {
    id: 'PROMO-001',
    name: 'Chào bạn mới',
    description: 'Giảm 10% cho đơn hàng từ 100.000đ.',
    code: 'CHAO10',
    discountType: 'PERCENT',
    discountValue: 10,
    minimumOrder: 100000,
    maximumDiscount: 30000,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    memberOnly: false,
    active: true
  },
  {
    id: 'PROMO-002',
    name: 'Ưu đãi thành viên',
    description: 'Ưu đãi dành riêng cho thành viên MilktyWay.',
    code: 'MEMBER10',
    discountType: 'PERCENT',
    discountValue: 10,
    minimumOrder: 0,
    maximumDiscount: 50000,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    memberOnly: true,
    active: true
  }
];

export const demoMembers: MemberProfile[] = [
  {
    id: 'MEMBER-DEMO-001',
    name: 'Khách hàng demo',
    phone: '0900000001',
    email: 'demo@milktyway.test',
    points: 1250,
    tier: 'GOLD',
    discountPercent: 10,
    joinedAt: '2026-01-01'
  }
];

export const memberTierLabels: Record<MemberTier, string> = {
  BRONZE: 'Đồng',
  SILVER: 'Bạc',
  GOLD: 'Vàng',
  VIP: 'VIP'
};
