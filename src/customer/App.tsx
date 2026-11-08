import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Coffee,
  CreditCard,
  Gift,
  Heart,
  Home,
  MapPin,
  Menu as MenuIcon,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import {
  availableAt,
  branches,
  categoryLabels,
  money,
  products,
  type Branch,
  type CartItem,
  type Category,
  type Order,
  type OrderStatus,
  type Product,
  type OrderActionRequest,
  type OrderComplaint,
  type PaymentMethod,
  type MemberProfile,
} from "./data";
import {
  ORDER_STORAGE_KEY,
  loadOrders,
  saveOrders,
  loadMemberProfile,
  saveMemberProfile,
} from "./mockStore";
import { OrderTrackingPage, OrderHistoryPage } from "./CustomerPages";
import { ComplaintPage } from "./CustomerPages";
import { PromotionsPage } from "./CustomerPages";
import { MembershipPage } from "./CustomerPages";

type Totals = {
  subtotal: number;
  loyalty: number;
  discount: number;
  shipping: number;
  total: number;
};
const readStore = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const getTotals = (
  items: CartItem[],
  member: boolean,
  code: string,
): Totals => {
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const loyalty = member ? Math.floor(subtotal * 0.1) : 0;
  const discount =
    code === "CHAO10" && subtotal >= 100000
      ? Math.min(30000, Math.floor((subtotal - loyalty) * 0.1))
      : 0;
  const shipping = subtotal === 0 || subtotal >= 150000 ? 0 : 15000;
  return {
    subtotal,
    loyalty,
    discount,
    shipping,
    total: subtotal - loyalty - discount + shipping,
  };
};
const uid = () =>
  globalThis.crypto?.randomUUID?.() ??
  `iv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const paymentLabels: Record<Order["paymentStatus"], string> = {
  UNPAID: "Chưa thanh toán",
  PENDING: "Đang chờ thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thanh toán thất bại",
  REFUND_PENDING: "Đang chờ hoàn tiền",
  REFUNDED: "Đã hoàn tiền",
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [branch, setBranch] = useState<Branch | null>(() =>
    readStore("MilktyWay-branch", null),
  );
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(() =>
    loadMemberProfile(),
  );
  const [cart, setCart] = useState<CartItem[]>(() =>
    readStore("MilktyWay-cart", []),
  );
  const [orders, setOrders] = useState<Order[]>(() => loadOrders());
  const [lastOrder, setLastOrder] = useState<Order | null>(() =>
    readStore("MilktyWay-last-order", null),
  );
  // =====================================================
  // CENTRALIZED ORDER STATE
  // orders là nguồn dữ liệu chính.
  // ordersRef giúp các hàm luôn đọc được dữ liệu mới nhất.
  // =====================================================

  const ordersRef = useRef<Order[]>(orders);

  // Thay thế toàn bộ danh sách đơn hàng.
  const replaceOrders = (nextOrders: Order[]) => {
    ordersRef.current = nextOrders;
    setOrders(nextOrders);
  };

  // Cập nhật một đơn hàng theo ID.
  // Hàm trả về object mới sau khi cập nhật thành công.
  const updateOrder = (
    orderId: string,
    updater: (currentOrder: Order) => Order,
  ): Order | null => {
    const currentOrder = ordersRef.current.find(
      (order) => order.id === orderId,
    );

    if (!currentOrder) {
      return null;
    }

    const updatedOrder = updater(currentOrder);

    const nextOrders = ordersRef.current.map((order) =>
      order.id === orderId ? updatedOrder : order,
    );

    replaceOrders(nextOrders);

    // Đồng bộ đơn hàng vừa cập nhật nếu đang là đơn gần nhất.
    setLastOrder((currentLastOrder) =>
      currentLastOrder?.id === orderId ? updatedOrder : currentLastOrder,
    );

    return updatedOrder;
  };
  const [couponInput, setCouponInput] = useState("");
  const [memberPhone, setMemberPhone] = useState(() =>
    readStore("MilktyWay-member-phone", ""),
  );
  useEffect(() => {
    localStorage.setItem("MilktyWay-member-phone", JSON.stringify(memberPhone));
  }, [memberPhone]);
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [branchOpen, setBranchOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");

  useEffect(() => {
    localStorage.setItem("MilktyWay-branch", JSON.stringify(branch));
  }, [branch]);
  useEffect(() => {
    localStorage.setItem("MilktyWay-cart", JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    const saved = saveOrders(orders);

    if (!saved) {
      console.error("Không thể lưu danh sách đơn hàng.");
    }
  }, [orders]);
  // =====================================================
  // CROSS-TAB ORDER SYNCHRONIZATION
  // Đồng bộ khi localStorage thay đổi từ tab khác.
  // =====================================================

  useEffect(() => {
    const handleOrdersStorage = (event: StorageEvent) => {
      if (event.key !== ORDER_STORAGE_KEY && event.key !== null) {
        return;
      }

      // Nếu key bị xóa hoặc localStorage.clear() được gọi.
      // Không gọi loadOrders() trong trường hợp này vì
      // loadOrders có thể khởi tạo lại mock data.
      const nextOrders = event.newValue === null ? [] : loadOrders();

      ordersRef.current = nextOrders;
      setOrders(nextOrders);

      // Đồng bộ lastOrder nếu đơn tương ứng còn tồn tại.
      setLastOrder((currentLastOrder) => {
        if (!currentLastOrder) {
          return null;
        }

        return (
          nextOrders.find((order) => order.id === currentLastOrder.id) ?? null
        );
      });
    };

    window.addEventListener("storage", handleOrdersStorage);

    return () => {
      window.removeEventListener("storage", handleOrdersStorage);
    };
  }, []);
  useEffect(() => {
    localStorage.setItem("MilktyWay-last-order", JSON.stringify(lastOrder));
  }, [lastOrder]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    setBranchOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    const saved = saveMemberProfile(memberProfile);

    if (!saved) {
      setToast("Không thể lưu hồ sơ thành viên.");
    }
  }, [memberProfile]);

  const selectedItems = useMemo(
    () => cart.filter((item) => item.selected),
    [cart],
  );
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const selectedCount = selectedItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const normalizedMemberPhone = memberPhone.replace(/\s/g, "");

  const member =
    normalizedMemberPhone === "0900000001" ||
    memberProfile?.phone === normalizedMemberPhone;
  const totals = getTotals(selectedItems, !!member, couponCode);

  const openProduct = (product: Product) => {
    if (!branch) {
      setToast("Vui lòng chọn chi nhánh trước khi chọn món.");
      setBranchOpen(true);
      return;
    }
    setEditingItem(null);
    setProductToEdit(product);
  };

  const chooseBranch = (next: Branch) => {
    if (branch && branch.id !== next.id && cart.length) {
      const confirmed = window.confirm(
        "Đổi chi nhánh sẽ xóa giỏ hàng hiện tại vì mỗi chi nhánh có tình trạng món riêng. Bạn có muốn tiếp tục?",
      );
      if (!confirmed) return;
      setCart([]);
      setCouponCode("");
      setCouponInput("");
      setCouponMessage("");
    }
    setBranch(next);
    setBranchOpen(false);
    setToast(`Đã chọn ${next.name}`);
  };

  const addToCart = (
    product: Product,
    size: string,
    sugar: string,
    ice: string,
    toppings: string[],
    quantity: number,
  ) => {
    if (!branch || !availableAt(branch, product.id)) {
      setToast("Món hiện không có tại chi nhánh đã chọn.");
      return;
    }
    const toppingCost = toppings.reduce(
      (sum, topping) => sum + (topping === "Trân châu đen" ? 5000 : 7000),
      0,
    );
    const unitPrice = product.price + (size === "L" ? 6000 : 0) + toppingCost;
    const detail =
      product.category === "combo"
        ? `Combo · ${sugar} đường · ${ice}`
        : `${size} · ${sugar} đường · ${ice}${toppings.length ? ` · ${toppings.join(", ")}` : ""}`;
    if (editingItem) {
      setCart((items) =>
        items.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                size,
                sugar,
                ice,
                toppings,
                detail,
                unitPrice,
                quantity,
              }
            : item,
        ),
      );
      setEditingItem(null);
      setToast("Đã cập nhật món trong giỏ hàng.");
    } else {
      setCart((items) => [
        ...items,
        {
          id: uid(),
          productId: product.id,
          name: product.name,
          image: product.image,
          detail,
          size,
          sugar,
          ice,
          toppings,
          unitPrice,
          quantity,
          selected: true,
        },
      ]);
      setToast("Đã thêm món vào giỏ hàng.");
    }
    setProductToEdit(null);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((items) =>
      items.flatMap((item) => {
        if (item.id !== id) return [item];
        const next = item.quantity + delta;
        return next > 0 ? [{ ...item, quantity: Math.min(20, next) }] : [];
      }),
    );
  };
  const toggleItem = (id: string) =>
    setCart((items) =>
      items.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item,
      ),
    );
  const toggleAll = () => {
    const allSelected = cart.length > 0 && cart.every((item) => item.selected);
    setCart((items) =>
      items.map((item) => ({ ...item, selected: !allSelected })),
    );
  };
  const removeItem = (id: string) =>
    setCart((items) => items.filter((item) => item.id !== id));
  const applyCoupon = () => {
    const value = couponInput.trim().toUpperCase();
    if (value === "CHAO10" && totals.subtotal >= 100000) {
      setCouponCode(value);
      setCouponMessage("Đã áp dụng ưu đãi 10%, tối đa 30.000đ.");
    } else {
      setCouponCode("");
      setCouponMessage(
        value === "CHAO10"
          ? "Đơn hàng cần đạt tối thiểu 100.000đ."
          : "Mã giảm giá không hợp lệ.",
      );
    }
  };
  const submitOrder = (form: HTMLFormElement) => {
    try {
      if (!branch || !selectedItems.length) {
        setToast("Vui lòng chọn chi nhánh và sản phẩm.");
        return;
      }

      const data = new FormData(form);
      const now = new Date().toISOString();

      const paymentNames: Record<PaymentMethod, string> = {
        COD: "Thanh toán khi nhận hàng (COD)",
        MOMO: "Ví MoMo (demo)",
        BANK_TRANSFER: "Chuyển khoản ngân hàng (demo)",
      };

      const next: Order = {
        id: `IV-${Date.now().toString().slice(-8)}`,
        createdAt: now,
        name: String(data.get("name") || "").trim(),
        phone: String(data.get("phone") || "").trim(),
        address: String(data.get("address") || "").trim(),
        note: String(data.get("note") || "").trim(),
        branchName: branch.name,
        items: selectedItems.map((item) => ({ ...item })),
        subtotal: totals.subtotal,
        discount: totals.loyalty + totals.discount,
        shipping: totals.shipping,
        total: totals.total,
        payment: paymentNames[paymentMethod],
        status: "PENDING_CONFIRMATION",
        paymentMethod,
        paymentStatus: paymentMethod === "COD" ? "UNPAID" : "PENDING",
        statusHistory: [
          {
            status: "PENDING_CONFIRMATION",
            at: now,
            note: "Đơn hàng đã được tạo.",
          },
        ],
        actionRequests: [],
        complaints: [],
      };

      replaceOrders([next, ...ordersRef.current]);
      setLastOrder(next);
      setCart((items) => items.filter((item) => !item.selected));

      setCouponCode("");
      setCouponInput("");
      setCouponMessage("");
      setPaymentMethod("COD");

      navigate("/confirmation");
    } catch (error) {
      console.error("Lỗi khi tạo đơn hàng:", error);
      setToast("Không thể tạo đơn hàng. Vui lòng thử lại.");
    }
  };

  const mockPaymentResult = (orderId: string, result: "PAID" | "FAILED") => {
    try {
      const updatedOrder = updateOrder(orderId, (currentOrder) => ({
        ...currentOrder,
        paymentStatus: result,
      }));

      if (!updatedOrder) {
        setToast("Không tìm thấy đơn hàng.");
        return;
      }

      setToast(
        result === "PAID"
          ? "Đã mô phỏng thanh toán thành công."
          : "Đã mô phỏng thanh toán thất bại.",
      );
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái thanh toán demo:", error);

      setToast("Không thể cập nhật trạng thái thanh toán.");
    }
  };

  const requestOrderAction = (
    orderId: string,
    type: OrderActionRequest["type"],
    reason: string,
  ): Order | null => {
    try {
      // Luôn lấy dữ liệu mới nhất từ ordersRef.
      const targetOrder = ordersRef.current.find(
        (order) => order.id === orderId,
      );

      if (!targetOrder) {
        setToast("Không tìm thấy đơn hàng.");
        return null;
      }

      const canRequest =
        targetOrder.status === "PENDING_CONFIRMATION" ||
        targetOrder.status === "CONFIRMED";

      if (!canRequest) {
        setToast("Đơn hàng đã quá thời hạn đổi hoặc hủy.");
        return null;
      }

      // Không cho gửi nhiều yêu cầu khi yêu cầu trước
      // vẫn đang chờ cửa hàng xử lý.
      const hasPendingRequest = targetOrder.actionRequests.some(
        (request) => request.requestStatus === "PENDING",
      );

      if (hasPendingRequest) {
        setToast("Đơn hàng đã có yêu cầu đang chờ xử lý.");
        return null;
      }

      const now = new Date().toISOString();

      const request: OrderActionRequest = {
        id: uid(),
        type,
        reason,
        createdAt: now,
        requestStatus: "PENDING",
      };

      const updatedOrder = updateOrder(orderId, (currentOrder) => {
        const nextStatus =
          type === "CANCEL" ? "CANCEL_REQUESTED" : currentOrder.status;

        return {
          ...currentOrder,

          status: nextStatus,

          actionRequests: [...currentOrder.actionRequests, request],

          statusHistory:
            type === "CANCEL"
              ? [
                  ...currentOrder.statusHistory,
                  {
                    status: "CANCEL_REQUESTED",
                    at: now,
                    note: "Khách hàng đã gửi yêu cầu hủy đơn.",
                  },
                ]
              : currentOrder.statusHistory,
        };
      });

      if (!updatedOrder) {
        setToast("Không thể cập nhật đơn hàng.");
        return null;
      }

      setToast("Đã ghi nhận yêu cầu của bạn.");

      return updatedOrder;
    } catch (error) {
      console.error("Lỗi khi gửi yêu cầu đổi/hủy đơn:", error);

      setToast("Không thể gửi yêu cầu. Vui lòng thử lại.");

      return null;
    }
  };

  const advanceOrderStatus = (orderId: string): Order | null => {
    try {
      // Lấy bản mới nhất của đơn hàng.
      const targetOrder = ordersRef.current.find(
        (order) => order.id === orderId,
      );

      if (!targetOrder) {
        setToast("Không tìm thấy đơn hàng.");
        return null;
      }

      // Các trạng thái tiếp theo.
      const nextStatusMap: Partial<Record<OrderStatus, OrderStatus>> = {
        PENDING_CONFIRMATION: "CONFIRMED",
        CONFIRMED: "PREPARING",
        PREPARING: "READY",
        READY: "DELIVERING",
        DELIVERING: "COMPLETED",
        CANCEL_REQUESTED: "CANCELLED",
      };

      const nextStatus = nextStatusMap[targetOrder.status];

      if (!nextStatus) {
        setToast("Đơn hàng đã ở trạng thái kết thúc.");
        return null;
      }

      const now = new Date().toISOString();

      const statusNotes: Partial<Record<OrderStatus, string>> = {
        CONFIRMED: "Cửa hàng đã xác nhận đơn hàng.",
        PREPARING: "Cửa hàng bắt đầu pha chế.",
        READY: "Đơn hàng đã pha chế xong.",
        DELIVERING: "Đơn hàng đang được giao đến bạn.",
        COMPLETED: "Đơn hàng đã được giao hoàn tất.",
        CANCELLED: "Cửa hàng đã xác nhận hủy đơn.",
      };

      const updatedOrder = updateOrder(orderId, (currentOrder) => {
        // Khi cửa hàng xác nhận hủy,
        // yêu cầu CANCEL đang chờ sẽ chuyển sang APPROVED.
        const updatedActionRequests =
          nextStatus === "CANCELLED"
            ? currentOrder.actionRequests.map((request) =>
                request.type === "CANCEL" && request.requestStatus === "PENDING"
                  ? {
                      ...request,
                      requestStatus: "APPROVED" as const,
                    }
                  : request,
              )
            : currentOrder.actionRequests;

        const statusNote =
          statusNotes[nextStatus] ?? "Trạng thái đơn hàng đã được cập nhật.";

        return {
          ...currentOrder,

          status: nextStatus,

          actionRequests: updatedActionRequests,

          statusHistory: [
            ...currentOrder.statusHistory,
            {
              status: nextStatus,
              at: now,
              note: statusNote,
            },
          ],
        };
      });

      if (!updatedOrder) {
        setToast("Không thể cập nhật trạng thái đơn hàng.");
        return null;
      }

      setToast(
        `Đã chuyển trạng thái: ${
          statusNotes[nextStatus] ?? "Trạng thái đơn hàng đã được cập nhật."
        }`,
      );

      return updatedOrder;
    } catch (error) {
      console.error("Lỗi khi mô phỏng trạng thái đơn hàng:", error);

      setToast("Không thể cập nhật trạng thái đơn hàng.");

      return null;
    }
  };

  const saveMember = (profile: MemberProfile) => {
    try {
      setMemberProfile(profile);
      setMemberPhone(profile.phone);
      setToast("Đã lưu thông tin hội viên.");
    } catch (error) {
      console.error("Lỗi cập nhật hồ sơ thành viên:", error);
      setToast("Không thể cập nhật thông tin hội viên.");
    }
  };

  const createComplaint = (
    orderId: string,
    phone: string,
    category: string,
    description: string,
  ): boolean => {
    try {
      const targetOrder = ordersRef.current.find(
        (order) =>
          order.id === orderId &&
          order.phone.replace(/\s/g, "") === phone.replace(/\s/g, ""),
      );

      if (!targetOrder) {
        return false;
      }

      const complaint: OrderComplaint = {
        id: uid(),
        category,
        description,
        createdAt: new Date().toISOString(),
        complaintStatus: "OPEN",
      };

      const updatedOrder = updateOrder(orderId, (currentOrder) => ({
        ...currentOrder,
        complaints: [...currentOrder.complaints, complaint],
      }));

      return updatedOrder !== null;
    } catch (error) {
      console.error("Lỗi khi tạo khiếu nại:", error);
      return false;
    }
  };

  return (
    <div className="app-shell">
      <div className="announcement">
        <Sparkles size={13} /> Trà ngon mỗi ngày · Miễn phí giao hàng cho đơn từ
        150.000đ
      </div>
      <Header
        count={count}
        branch={branch}
        onBranch={() => setBranchOpen(true)}
      />
      <main className="page-shell">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                branch={branch}
                onChooseBranch={() => setBranchOpen(true)}
                onPick={openProduct}
              />
            }
          />
          <Route
            path="/menu"
            element={
              <MenuPage
                branch={branch}
                onChooseBranch={() => setBranchOpen(true)}
                onPick={openProduct}
              />
            }
          />
          <Route
            path="/cart"
            element={
              <CartPage
                branch={branch}
                onPick={openProduct}
                cart={cart}
                selectedCount={selectedCount}
                totals={totals}
                couponInput={couponInput}
                couponMessage={couponMessage}
                onCouponInput={setCouponInput}
                onApplyCoupon={applyCoupon}
                onToggle={toggleItem}
                onToggleAll={toggleAll}
                onQuantity={updateQuantity}
                onRemove={removeItem}
                onEdit={(item) => {
                  setEditingItem(item);
                  setProductToEdit(
                    products.find((p) => p.id === item.productId) ?? null,
                  );
                }}
                onCheckout={() => navigate("/checkout")}
                onShop={() => navigate("/menu")}
              />
            }
          />
          <Route
            path="/checkout"
            element={
              <CheckoutPage
                branch={branch}
                items={selectedItems}
                count={selectedCount}
                totals={totals}
                memberPhone={memberPhone}
                onMemberPhone={setMemberPhone}
                paymentMethod={paymentMethod}
                onPaymentMethod={setPaymentMethod}
                onSubmit={submitOrder}
                onBack={() => navigate("/cart")}
              />
            }
          />
          <Route
            path="/confirmation"
            element={
              <ConfirmationPage
                order={lastOrder ?? orders[0] ?? null}
                onShop={() => navigate("/menu")}
                onMockPaymentResult={mockPaymentResult}
              />
            }
          />
          <Route
            path="/track"
            element={
              <OrderTrackingPage
                orders={orders}
                onRequestAction={requestOrderAction}
                onAdvanceOrderStatus={advanceOrderStatus}
                demoMode={import.meta.env.DEV}
              />
            }
          />
          <Route
            path="/membership"
            element={
              <MembershipPage profile={memberProfile} onSave={saveMember} />
            }
          />
          <Route path="/promotions" element={<PromotionsPage />} />
          <Route
            path="/orders"
            element={<OrderHistoryPage orders={orders} />}
          />
          <Route path="*" element={<NotFound />} />

          <Route
            path="/complaints"
            element={
              <ComplaintPage
                orders={orders}
                onCreateComplaint={createComplaint}
              />
            }
          />
        </Routes>
      </main>
      <BottomNav count={count} />
      <Footer />
      {branchOpen && (
        <BranchDialog
          current={branch}
          onClose={() => setBranchOpen(false)}
          onChoose={chooseBranch}
        />
      )}
      {productToEdit && (
        <ProductDialog
          product={productToEdit}
          initial={editingItem}
          onClose={() => {
            setProductToEdit(null);
            setEditingItem(null);
          }}
          onAdd={addToCart}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}

function Header({
  count,
  branch,
  onBranch,
}: {
  count: number;
  branch: Branch | null;
  onBranch: () => void;
}) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="brand-lockup">
          <span className="brand-mark">i</span>
          <span>
            <b>MilktyWay</b>
            <small>TEA & MOMENTS</small>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Điều hướng chính">
          <NavLink to="/">Trang chủ</NavLink>
          <NavLink to="/menu">Thực đơn</NavLink>
          <NavLink to="/orders">Lịch sử</NavLink>
          <NavLink to="/track">Tra cứu đơn</NavLink>
        </nav>
        <div className="header-actions">
          <button className="branch-trigger" onClick={onBranch}>
            <MapPin size={16} />
            <span>{branch?.name ?? "Chọn chi nhánh"}</span>
            <ChevronDown size={15} />
          </button>
          <Link
            to="/cart"
            className="header-cart"
            aria-label={`Giỏ hàng, ${count} sản phẩm`}
          >
            <ShoppingBag size={19} />
            <span>Giỏ hàng</span>
            {count > 0 && <b>{count}</b>}
          </Link>
        </div>
      </div>
    </header>
  );
}

function BottomNav({ count }: { count: number }) {
  const items = [
    { to: "/", label: "Trang chủ", icon: Home, end: true },
    { to: "/menu", label: "Thực đơn", icon: Coffee },
    { to: "/orders", label: "Lịch sử", icon: Clock3 },
    { to: "/track", label: "Tra cứu", icon: PackageCheck },
    { to: "/cart", label: "Giỏ hàng", icon: ShoppingBag, count },
  ];
  return (
    <nav className="mobile-bottom-nav" aria-label="Điều hướng trên điện thoại">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `mobile-nav-item${isActive ? " active" : ""}`
          }
        >
          <span className="nav-icon-wrap">
            <item.icon size={21} />
            {"count" in item && item.count! > 0 && (
              <b className="nav-count">{item.count}</b>
            )}
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <Link to="/" className="brand-lockup footer-brand">
            <span className="brand-mark">i</span>
            <span>
              <b>MilktyWay</b>
              <small>TEA & MOMENTS</small>
            </span>
          </Link>
          <p>Trà ngon cho những khoảnh khắc thường ngày.</p>
        </div>
        <div className="footer-links">
          <Link to="/menu">Thực đơn</Link>
          <Link to="/orders">Lịch sử mua hàng</Link>
          <Link to="/track">Tra cứu đơn hàng</Link>
          <Link to="/cart">Giỏ hàng</Link>
          <button
            className="footer-member-link"
            onClick={() =>
              document
                .querySelector<HTMLInputElement>('[name="memberPhone"]')
                ?.focus()
            }
          >
            Ưu đãi hội viên
          </button>
        </div>
        <small className="demo-note">
          Frontend demo · Chưa kết nối hệ thống đặt hàng thực tế
        </small>
      </div>
    </footer>
  );
}

function HomePage({
  branch,
  onChooseBranch,
  onPick,
}: {
  branch: Branch | null;
  onChooseBranch: () => void;
  onPick: (product: Product) => void;
}) {
  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={13} /> TRÀ NGON · KHOẢNH KHẮC ĐẸP
          </span>
          <h1>
            Chậm một chút.
            <br />
            Thưởng trà,
            <br />
            <em>thêm niềm vui.</em>
          </h1>
          <p>
            Trà thơm, sữa béo và topping bạn thích. Pha theo gu riêng, giao đến
            tận nơi.
          </p>
          <div className="hero-actions">
            <Link to="/menu" className="btn btn-primary">
              Khám phá thực đơn <ArrowRight size={17} />
            </Link>
            <button className="btn btn-soft" onClick={onChooseBranch}>
              <MapPin size={16} />
              {branch?.name ?? "Chọn chi nhánh"}
            </button>
          </div>
          <div className="hero-footnote">
            <span>
              <BadgeCheck size={15} /> Pha theo lựa chọn
            </span>
            <span>
              <Truck size={15} /> Giao tận nơi
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-orbit">FRESHLY BREWED · MADE FOR YOU</div>
          <div className="hero-photo">
            <img
              src="https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=1000&q=90"
              alt="Ly trà sữa MilktyWay"
            />
            <span className="photo-sticker">
              YOUR DAILY
              <br />
              HAPPY CUP
            </span>
          </div>
          <div className="hero-caption">
            <b>Signature milk tea</b>
            <span>Đậm trà. Tròn vị.</span>
          </div>
        </div>
      </section>
      <section className="home-intro section-block">
        <div>
          <span className="eyebrow">CHỌN THEO TÂM TRẠNG</span>
          <h2>
            Một chút ngon lành
            <br />
            cho hôm nay.
          </h2>
        </div>
        <div className="intro-right">
          <p>
            Khám phá những hương vị quen thuộc, chọn mức đường đá và topping
            theo đúng gu của bạn.
          </p>
          <Link to="/menu" className="text-link">
            Xem thực đơn <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      <section className="section-block product-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">MỘT NGỤM LÀ THÍCH</span>
            <h2>Món được yêu thích</h2>
          </div>
          <Link to="/menu" className="text-link">
            Xem tất cả <ArrowRight size={16} />
          </Link>
        </div>
        <div className="product-grid home-products">
          {products
            .filter((p) => p.id <= 6)
            .slice(0, 4)
            .map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                branch={branch}
                onPick={onPick}
              />
            ))}
        </div>
      </section>
      <section className="combo-banner">
        <div>
          <span className="eyebrow">SHARE THE JOY</span>
          <h2>
            Đi cùng nhau,
            <br />
            vui gấp đôi.
          </h2>
          <p>Combo dành cho những cuộc hẹn dễ thương.</p>
          <Link to="/menu" className="btn btn-primary">
            Chọn combo <ArrowRight size={16} />
          </Link>
        </div>
        <img
          src="https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=85"
          alt="Hai ly đồ uống tươi mát"
        />
      </section>
    </>
  );
}

function MenuPage({
  branch,
  onChooseBranch,
  onPick,
}: {
  branch: Branch | null;
  onChooseBranch: () => void;
  onPick: (product: Product) => void;
}) {
  const [category, setCategory] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const filtered = useMemo(() => {
    let result = products.filter(
      (p) =>
        (category === "all" || p.category === category) &&
        `${p.name} ${p.sku}`.toLowerCase().includes(query.toLowerCase().trim()),
    );
    if (sort === "price-asc")
      result = [...result].sort((a, b) => a.price - b.price);
    if (sort === "price-desc")
      result = [...result].sort((a, b) => b.price - a.price);
    return result;
  }, [category, query, sort]);
  return (
    <section className="menu-page">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">PHA THEO GU CỦA BẠN</span>
          <h1>Hôm nay, bạn uống gì?</h1>
          <p>Chọn món yêu thích và tùy chỉnh theo khẩu vị.</p>
        </div>
        <button className="branch-pill" onClick={onChooseBranch}>
          <MapPin size={16} />
          <span>{branch?.name ?? "Chọn chi nhánh"}</span>
          <ChevronDown size={15} />
        </button>
      </div>
      {!branch && (
        <div className="branch-notice">
          <MapPin size={19} />
          <div>
            <b>Chọn chi nhánh trước khi đặt món</b>
            <span>
              Thực đơn và tình trạng món có thể khác nhau theo cửa hàng.
            </span>
          </div>
          <button
            className="btn btn-primary btn-small"
            onClick={onChooseBranch}
          >
            Chọn chi nhánh
          </button>
        </div>
      )}
      <div className="menu-toolbar">
        <label className="search-box">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm tên món hoặc mã món..."
            aria-label="Tìm sản phẩm"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Xóa tìm kiếm">
              <X size={16} />
            </button>
          )}
        </label>
        <label className="sort-control">
          <SlidersHorizontal size={16} />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sắp xếp sản phẩm"
          >
            <option value="featured">Đề xuất</option>
            <option value="price-asc">Giá thấp đến cao</option>
            <option value="price-desc">Giá cao đến thấp</option>
          </select>
        </label>
      </div>
      <div className="category-chips" aria-label="Danh mục sản phẩm">
        {(Object.keys(categoryLabels) as Array<Category | "all">).map((key) => (
          <button
            key={key}
            className={category === key ? "chip active" : "chip"}
            onClick={() => setCategory(key)}
          >
            {categoryLabels[key]}
          </button>
        ))}
      </div>
      <div className="result-count">
        {filtered.length} sản phẩm{" "}
        {category !== "all" ? `· ${categoryLabels[category]}` : ""}
      </div>
      {filtered.length ? (
        <div className="product-grid">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              branch={branch}
              onPick={onPick}
            />
          ))}
        </div>
      ) : (
        <div className="empty-search">
          <Search size={28} />
          <h3>Không tìm thấy món phù hợp</h3>
          <p>Thử tên món khác hoặc xóa bộ lọc.</p>
          <button
            className="btn btn-soft"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
    </section>
  );
}

function ProductCard({
  product,
  branch,
  onPick,
}: {
  product: Product;
  branch: Branch | null;
  onPick: (product: Product) => void;
}) {
  const unavailable = !!branch && !availableAt(branch, product.id);
  return (
    <article className={`product-card${unavailable ? " unavailable" : ""}`}>
      <button
        className="product-visual"
        onClick={() => !unavailable && onPick(product)}
        disabled={unavailable}
        aria-label={`Xem ${product.name}`}
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=720&q=80";
          }}
        />
        {product.badge && (
          <span className="product-badge">{product.badge}</span>
        )}
        {unavailable && (
          <span className="unavailable-overlay">Tạm hết tại chi nhánh</span>
        )}
        <span className="quick-add">
          <Plus size={19} />
        </span>
      </button>
      <div className="product-info">
        <span className="product-category">
          {categoryLabels[product.category]}
        </span>
        <button
          className="product-name"
          onClick={() => !unavailable && onPick(product)}
          disabled={unavailable}
        >
          {product.name}
        </button>
        <p className="product-description">{product.description}</p>
        <div className="product-card-bottom">
          <b>{money(product.price)}</b>
          <button
            className="add-button"
            disabled={unavailable || !branch}
            onClick={() => onPick(product)}
            aria-label={`Thêm ${product.name}`}
          >
            <Plus size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}

function BranchDialog({
  current,
  onClose,
  onChoose,
}: {
  current: Branch | null;
  onClose: () => void;
  onChoose: (branch: Branch) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = branches.filter((b) =>
    `${b.name} ${b.area} ${b.address}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div
      className="overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="dialog branch-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="branch-title"
      >
        <div className="dialog-header">
          <div>
            <span className="eyebrow">MilktyWay STORES</span>
            <h2 id="branch-title">Chọn chi nhánh</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Đóng">
            <X />
          </button>
        </div>
        <p className="dialog-desc">
          Chọn cửa hàng để xem thực đơn và tình trạng món phù hợp.
        </p>
        <label className="search-box dialog-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm tên chi nhánh, khu vực..."
          />
        </label>
        <div className="branch-list">
          {filtered.map((branch) => (
            <button
              key={branch.id}
              className={`branch-option${current?.id === branch.id ? " selected" : ""}`}
              onClick={() => onChoose(branch)}
            >
              <span className="branch-pin">
                <MapPin size={18} />
              </span>
              <span className="branch-option-copy">
                <b>{branch.name}</b>
                <small>{branch.address}</small>
                <em>
                  <span className="status-dot" />{" "}
                  {branch.open ? "Đang phục vụ" : "Tạm đóng cửa"}
                </em>
              </span>
              {current?.id === branch.id ? (
                <BadgeCheck className="selected-check" />
              ) : (
                <ChevronRight className="branch-arrow" />
              )}
            </button>
          ))}
          {!filtered.length && (
            <div className="empty-inline">
              Không tìm thấy chi nhánh phù hợp.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ProductDialog({
  product,
  initial,
  onClose,
  onAdd,
}: {
  product: Product;
  initial: CartItem | null;
  onClose: () => void;
  onAdd: (
    product: Product,
    size: string,
    sugar: string,
    ice: string,
    toppings: string[],
    quantity: number,
  ) => void;
}) {
  const [size, setSize] = useState(initial?.size ?? "M");
  const [sugar, setSugar] = useState(initial?.sugar ?? "50%");
  const [ice, setIce] = useState(initial?.ice ?? "Vừa đá");
  const [toppings, setToppings] = useState<string[]>(initial?.toppings ?? []);
  const [quantity, setQuantity] = useState(initial?.quantity ?? 1);
  const price =
    product.price +
    (size === "L" ? 6000 : 0) +
    toppings.reduce((sum, t) => sum + (t === "Trân châu đen" ? 5000 : 7000), 0);
  const toggle = (value: string) =>
    setToppings((old) =>
      old.includes(value) ? old.filter((x) => x !== value) : [...old, value],
    );
  return (
    <div
      className="overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="dialog product-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-dialog-title"
      >
        <div className="dialog-header">
          <h2 id="product-dialog-title">
            {initial ? "Chỉnh sửa món" : "Tùy chỉnh món"}
          </h2>
          <button className="icon-button" onClick={onClose} aria-label="Đóng">
            <X />
          </button>
        </div>
        <div className="product-dialog-content">
          <img
            className="dialog-product-image"
            src={product.image}
            alt={product.name}
          />
          <div className="dialog-product-heading">
            <div>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
            </div>
            <b>{money(price)}</b>
          </div>
          <div className="option-group">
            <div className="option-title">
              <b>Kích cỡ</b>
              <small>Chọn size phù hợp</small>
            </div>
            <div className="choice-row">
              {["M", ...(product.allowLarge ? ["L"] : [])].map((value) => (
                <button
                  key={value}
                  className={size === value ? "choice active" : "choice"}
                  onClick={() => setSize(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <div className="option-group">
            <div className="option-title">
              <b>Lượng đường</b>
            </div>
            <div className="choice-row wrap">
              {["0%", "30%", "50%", "70%", "100%"].map((value) => (
                <button
                  key={value}
                  className={sugar === value ? "choice active" : "choice"}
                  onClick={() => setSugar(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <div className="option-group">
            <div className="option-title">
              <b>Lượng đá</b>
            </div>
            <div className="choice-row wrap">
              {["Không đá", "Ít đá", "Vừa đá"].map((value) => (
                <button
                  key={value}
                  className={ice === value ? "choice active" : "choice"}
                  onClick={() => setIce(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          {product.category !== "combo" && (
            <div className="option-group">
              <div className="option-title">
                <b>Topping</b>
                <small>Có thể chọn nhiều</small>
              </div>
              <label className="topping-row">
                <span>
                  <b>Trân châu đen</b>
                  <small>+5.000đ</small>
                </span>
                <input
                  type="checkbox"
                  checked={toppings.includes("Trân châu đen")}
                  onChange={() => toggle("Trân châu đen")}
                />
              </label>
              <label className="topping-row">
                <span>
                  <b>Pudding</b>
                  <small>+7.000đ</small>
                </span>
                <input
                  type="checkbox"
                  checked={toppings.includes("Pudding")}
                  onChange={() => toggle("Pudding")}
                />
              </label>
            </div>
          )}
          <div className="dialog-bottom">
            <div className="quantity-control">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Giảm số lượng"
              >
                <Minus size={16} />
              </button>
              <b>{quantity}</b>
              <button
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                aria-label="Tăng số lượng"
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              className="btn btn-primary dialog-add"
              onClick={() =>
                onAdd(product, size, sugar, ice, toppings, quantity)
              }
            >
              {initial ? "Lưu thay đổi" : "Thêm vào giỏ"} ·{" "}
              {money(price * quantity)}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function QuantityControl({
  quantity,
  onChange,
}: {
  quantity: number;
  onChange: (delta: number) => void;
}) {
  return (
    <div className="quantity-control">
      <button onClick={() => onChange(-1)} aria-label="Giảm số lượng">
        <Minus size={15} />
      </button>
      <b>{quantity}</b>
      <button onClick={() => onChange(1)} aria-label="Tăng số lượng">
        <Plus size={15} />
      </button>
    </div>
  );
}

function CartItemCard({
  item,
  onToggle,
  onQuantity,
  onRemove,
  onEdit,
}: {
  item: CartItem;
  onToggle: () => void;
  onQuantity: (delta: number) => void;
  onRemove: () => void;
  onEdit: () => void;
}) {
  return (
    <article className={`cart-item-card${item.selected ? " is-selected" : ""}`}>
      <label className="cart-select">
        <input
          type="checkbox"
          checked={item.selected}
          onChange={onToggle}
          aria-label={`Chọn ${item.name}`}
        />
      </label>
      <img className="cart-item-image" src={item.image} alt={item.name} />
      <div className="cart-item-main">
        <div className="cart-item-top">
          <div>
            <h3>{item.name}</h3>
            <p>{item.detail}</p>
          </div>
          <button
            className="remove-item"
            onClick={onRemove}
            aria-label={`Xóa ${item.name}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
        <button className="edit-options" onClick={onEdit}>
          Chỉnh sửa lựa chọn <ChevronRight size={14} />
        </button>
        <div className="cart-item-bottom">
          <b>{money(item.unitPrice)}</b>
          <QuantityControl quantity={item.quantity} onChange={onQuantity} />
        </div>
      </div>
    </article>
  );
}

function OrderSummary({
  totals,
  title = "Tóm tắt đơn hàng",
}: {
  totals: Totals;
  title?: string;
}) {
  return (
    <section className="summary-card">
      <h2>{title}</h2>
      <div className="summary-line">
        <span>Tạm tính</span>
        <b>{money(totals.subtotal)}</b>
      </div>
      {totals.loyalty > 0 && (
        <div className="summary-line discount">
          <span>Ưu đãi hội viên · 10%</span>
          <b>−{money(totals.loyalty)}</b>
        </div>
      )}
      {totals.discount > 0 && (
        <div className="summary-line discount">
          <span>Ưu đãi CHAO10</span>
          <b>−{money(totals.discount)}</b>
        </div>
      )}
      <div className="summary-line">
        <span>Giao hàng</span>
        <b>{money(totals.shipping)}</b>
      </div>
      <div className="summary-divider" />
      <div className="summary-total">
        <span>Tổng cộng</span>
        <b>{money(totals.total)}</b>
      </div>
      <p className="summary-hint">Miễn phí giao hàng cho đơn từ 150.000đ.</p>
    </section>
  );
}

function CartPage(props: {
  branch: Branch | null;
  onPick: (product: Product) => void;
  cart: CartItem[];
  selectedCount: number;
  totals: Totals;
  couponInput: string;
  couponMessage: string;
  onCouponInput: (v: string) => void;
  onApplyCoupon: () => void;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onEdit: (item: CartItem) => void;
  onCheckout: () => void;
  onShop: () => void;
}) {
  const allSelected =
    props.cart.length > 0 && props.cart.every((item) => item.selected);
  const recommendations = products.filter((p) => [1, 3, 7, 101].includes(p.id));
  return (
    <section className="cart-page">
      <div className="page-kicker">
        <span className="eyebrow">YOUR BAG</span>
        <h1>Giỏ hàng</h1>
        <p>Kiểm tra món đã chọn trước khi hoàn tất đơn hàng.</p>
      </div>
      {props.cart.length === 0 ? (
        <div className="cart-empty-layout">
          <div className="empty-cart-card">
            <div className="empty-cart-art">
              <div className="empty-bag">
                <ShoppingBag size={64} />
                <span>0</span>
              </div>
              <span className="art-spark spark-one">＋</span>
              <span className="art-spark spark-two">○</span>
              <span className="art-spark spark-three">✳</span>
            </div>
            <div className="empty-cart-copy">
              <h2>Giỏ hàng đang trống</h2>
              <p>
                Bạn chưa có món nào trong giỏ. Cùng chọn một thức uống thật ngon
                nhé.
              </p>
              <button className="btn btn-primary" onClick={props.onShop}>
                Khám phá thực đơn <ArrowRight size={16} />
              </button>
            </div>
          </div>
          <section className="recommendation-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">MAYBE YOU'LL LOVE</span>
                <h2>Gợi ý cho bạn</h2>
              </div>
              <Link to="/menu" className="text-link">
                Xem tất cả <ChevronRight size={17} />
              </Link>
            </div>
            <div className="product-grid recommendation-grid">
              {recommendations.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  branch={props.branch}
                  onPick={props.onPick}
                />
              ))}
            </div>
            <p className="recommendation-note">
              Chọn chi nhánh và sản phẩm tại trang thực đơn để thêm món vào giỏ.
            </p>
          </section>
        </div>
      ) : (
        <>
          <div className="cart-branch-row">
            <span className="branch-icon">
              <MapPin size={18} />
            </span>
            <div>
              <small>Cửa hàng phục vụ</small>
              <b>
                {readStore<Branch | null>("MilktyWay-branch", null)?.name ??
                  "Chi nhánh đã chọn"}
              </b>
            </div>
            <span className="branch-row-caption">Đơn hàng theo chi nhánh</span>
          </div>
          <div className="cart-layout">
            <div className="cart-list-column">
              <div className="cart-list-header">
                <label className="select-all">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={props.onToggleAll}
                  />{" "}
                  Chọn tất cả ({props.cart.length})
                </label>
                <span>
                  {props.cart.reduce((s, i) => s + i.quantity, 0)} sản phẩm
                </span>
              </div>
              {props.cart.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  onToggle={() => props.onToggle(item.id)}
                  onQuantity={(d) => props.onQuantity(item.id, d)}
                  onRemove={() => props.onRemove(item.id)}
                  onEdit={() => props.onEdit(item)}
                />
              ))}
            </div>
            <aside className="cart-summary-column">
              <section className="coupon-card">
                <h3>Mã ưu đãi</h3>
                <div className="coupon-input-row">
                  <input
                    value={props.couponInput}
                    onChange={(e) => props.onCouponInput(e.target.value)}
                    placeholder="Nhập mã giảm giá"
                    aria-label="Mã giảm giá"
                  />
                  <button onClick={props.onApplyCoupon}>Áp dụng</button>
                </div>
                {props.couponMessage && (
                  <p
                    className={
                      props.couponMessage.startsWith("Đã")
                        ? "success-message"
                        : "error-message"
                    }
                  >
                    {props.couponMessage}
                  </p>
                )}
                <small>Thử mã CHAO10 cho đơn từ 100.000đ.</small>
              </section>
              <OrderSummary totals={props.totals} />
              <button
                className="btn btn-primary checkout-cta"
                disabled={!props.selectedCount}
                onClick={props.onCheckout}
              >
                Tiếp tục đặt hàng ({props.selectedCount}){" "}
                <ArrowRight size={17} />
              </button>
              <p className="secure-note">
                <BadgeCheck size={14} /> Kiểm tra đơn hàng trước khi xác nhận.
              </p>
            </aside>
          </div>
          <div className="mobile-cart-footer">
            <div>
              <small>{props.selectedCount} sản phẩm đã chọn</small>
              <b>{money(props.totals.total)}</b>
            </div>
            <button
              className="btn btn-primary"
              disabled={!props.selectedCount}
              onClick={props.onCheckout}
            >
              Đặt hàng <ArrowRight size={16} />
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function CheckoutPage({
  branch,
  items,
  count,
  totals,
  memberPhone,
  onMemberPhone,
  paymentMethod,
  onPaymentMethod,
  onSubmit,
  onBack,
}: {
  branch: Branch | null;
  items: CartItem[];
  count: number;
  totals: Totals;
  memberPhone: string;
  onMemberPhone: (value: string) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethod: (value: PaymentMethod) => void;
  onSubmit: (form: HTMLFormElement) => void;
  onBack: () => void;
}) {
  if (!items.length)
    return (
      <section className="checkout-empty">
        <ShoppingBag size={40} />
        <h1>Chưa có sản phẩm được chọn</h1>
        <p>Quay lại giỏ hàng và chọn ít nhất một món để tiếp tục.</p>
        <button className="btn btn-primary" onClick={onBack}>
          Quay lại giỏ hàng
        </button>
      </section>
    );
  return (
    <section className="checkout-page">
      <div className="page-kicker">
        <span className="eyebrow">ALMOST THERE</span>
        <h1>Hoàn tất đơn hàng</h1>
        <p>Chỉ còn vài thông tin để món ngon đến với bạn.</p>
      </div>
      <div className="checkout-layout">
        <form
          className="checkout-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(e.currentTarget);
          }}
        >
          <section className="form-card">
            <div className="form-section-heading">
              <span>01</span>
              <div>
                <h2>Thông tin giao hàng</h2>
                <p>Thông tin để cửa hàng liên hệ và giao món.</p>
              </div>
            </div>
            <label>
              Họ tên người nhận
              <input
                name="name"
                placeholder="Nhập họ tên"
                autoComplete="name"
                required
                maxLength={80}
              />
            </label>
            <label>
              Số điện thoại
              <input
                name="phone"
                placeholder="09xxxxxxxx"
                type="tel"
                autoComplete="tel"
                pattern="0[0-9]{9}"
                title="Nhập số điện thoại gồm 10 chữ số, bắt đầu bằng 0"
                required
              />
            </label>
            <label>
              Địa chỉ giao hàng
              <textarea
                name="address"
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                autoComplete="street-address"
                minLength={10}
                maxLength={300}
                required
              />
            </label>
            <label>
              Ghi chú cho cửa hàng{" "}
              <span className="optional">Không bắt buộc</span>
              <textarea
                name="note"
                placeholder="Ví dụ: ít túi nilon, gọi trước khi giao..."
                maxLength={300}
              />
            </label>
          </section>
          <section className="form-card">
            <div className="form-section-heading">
              <span>02</span>
              <div>
                <h2>Hội viên, chi nhánh & thanh toán</h2>
                <p>Kiểm tra ưu đãi, nơi chuẩn bị và phương thức thanh toán.</p>
              </div>
            </div>
            <label>
              Mã / số điện thoại hội viên{" "}
              <span className="optional">Không bắt buộc</span>
              <input
                name="memberPhone"
                value={memberPhone}
                onChange={(e) => onMemberPhone(e.target.value)}
                placeholder="Nhập mã hoặc SĐT hội viên"
                autoComplete="off"
              />
            </label>
            {memberPhone.replace(/\s/g, "") === "0900000001" ? (
              <p className="success-message">
                Hội viên VIP demo · Đang áp dụng giảm 10%.
              </p>
            ) : memberPhone ? (
              <p className="form-feedback">
                Chưa tìm thấy hội viên demo. Bạn vẫn có thể đặt hàng.
              </p>
            ) : null}
            <div className="checkout-branch">
              <MapPin size={19} />
              <div>
                <b>{branch?.name ?? "Chưa chọn chi nhánh"}</b>
                <small>{branch?.address}</small>
              </div>
            </div>
            <div className="payment-method-list">
              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "COD"}
                  onChange={() => onPaymentMethod("COD")}
                />
                <span>
                  <b>Thanh toán khi nhận hàng (COD)</b>
                  <small>Thanh toán trực tiếp khi nhận đồ uống.</small>
                </span>
                <CreditCard size={21} />
              </label>

              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "MOMO"}
                  onChange={() => onPaymentMethod("MOMO")}
                />
                <span>
                  <b>Ví MoMo</b>
                  <small>Thanh toán mô phỏng, chưa kết nối MoMo thật.</small>
                </span>
              </label>

              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "BANK_TRANSFER"}
                  onChange={() => onPaymentMethod("BANK_TRANSFER")}
                />
                <span>
                  <b>Chuyển khoản ngân hàng</b>
                  <small>Hiển thị thông tin chuyển khoản mẫu.</small>
                </span>
              </label>
            </div>
            <div className="demo-warning">
              Đây là bản frontend demo. Đơn hàng được lưu trong trình duyệt hiện
              tại, chưa gửi đến cửa hàng và không phát sinh thanh toán thực tế.
            </div>
          </section>
          <button className="btn btn-primary submit-order" type="submit">
            Xác nhận đơn hàng · {money(totals.total)} <ArrowRight size={17} />
          </button>
        </form>
        <aside className="checkout-aside">
          <div className="checkout-items-card">
            <h2>
              Đơn hàng của bạn <span>{count} món</span>
            </h2>
            {items.map((item) => (
              <div className="checkout-mini-item" key={item.id}>
                <img src={item.image} alt="" />
                <div>
                  <b>{item.name}</b>
                  <small>
                    {item.detail} · SL {item.quantity}
                  </small>
                </div>
                <strong>{money(item.unitPrice * item.quantity)}</strong>
              </div>
            ))}
          </div>
          <OrderSummary totals={totals} />
        </aside>
      </div>
    </section>
  );
}

function ConfirmationPage({
  order,
  onShop,
  onMockPaymentResult,
}: {
  order: Order | null;
  onShop: () => void;
  onMockPaymentResult: (orderId: string, result: "PAID" | "FAILED") => void;
}) {
  if (!order) {
    return (
      <section className="checkout-empty">
        <PackageCheck size={42} />
        <h1>Chưa có đơn hàng trong phiên này</h1>
        <p>Chọn món để bắt đầu một đơn hàng mới.</p>
        <button className="btn btn-primary" onClick={onShop}>
          Khám phá thực đơn
        </button>
      </section>
    );
  }

  const needsMockPayment =
    order.paymentMethod === "MOMO" || order.paymentMethod === "BANK_TRANSFER";

  return (
    <section className="confirmation-page">
      <div className="success-mark">
        <Check size={33} />
      </div>

      <span className="eyebrow">THANK YOU FOR CHOOSING MilktyWay</span>
      <h1>Đã tạo đơn demo!</h1>

      <p className="confirmation-lead">
        Thông tin đơn hàng đã được lưu trong trình duyệt hiện tại.
      </p>

      <div className="order-code">
        <small>Mã đơn hàng</small>
        <b>{order.id}</b>
        <span>{order.createdAt}</span>
      </div>

      <div className="confirmation-card">
        <div className="confirmation-row">
          <span>Người nhận</span>
          <b>{order.name}</b>
        </div>

        <div className="confirmation-row">
          <span>Số điện thoại</span>
          <b>{order.phone}</b>
        </div>

        <div className="confirmation-row">
          <span>Địa chỉ</span>
          <b>{order.address}</b>
        </div>

        <div className="confirmation-row">
          <span>Chi nhánh</span>
          <b>{order.branchName}</b>
        </div>

        <div className="confirmation-row">
          <span>Phương thức thanh toán</span>
          <b>{order.payment}</b>
        </div>

        <div className="confirmation-row">
          <span>Trạng thái thanh toán</span>
          <b>{paymentLabels[order.paymentStatus]}</b>
        </div>

        <div className="summary-divider" />

        <h3>Chi tiết sản phẩm</h3>

        {order.items.map((item) => (
          <div className="confirmation-item" key={item.id}>
            <span>
              {item.quantity} × {item.name}
              <small>{item.detail}</small>
            </span>
            <b>{money(item.unitPrice * item.quantity)}</b>
          </div>
        ))}

        <div className="summary-divider" />

        <div className="confirmation-row">
          <span>Tạm tính</span>
          <b>{money(order.subtotal)}</b>
        </div>

        <div className="confirmation-row">
          <span>Ưu đãi</span>
          <b>−{money(order.discount)}</b>
        </div>

        <div className="confirmation-row">
          <span>Giao hàng</span>
          <b>{money(order.shipping)}</b>
        </div>

        <div className="summary-total">
          <span>Tổng thanh toán</span>
          <b>{money(order.total)}</b>
        </div>

        {needsMockPayment && order.paymentStatus === "PENDING" && (
          <div className="mock-payment-panel">
            <h3>Thanh toán mô phỏng</h3>
            <p>
              Đây là giao dịch demo. Chưa có tiền được chuyển qua MoMo hoặc ngân
              hàng.
            </p>
            <p>
              Nội dung thanh toán: <b>{order.id}</b>
            </p>
            <p>
              Số tiền: <b>{money(order.total)}</b>
            </p>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onMockPaymentResult(order.id, "PAID")}
            >
              Mô phỏng thanh toán thành công
            </button>

            <button
              type="button"
              className="btn btn-soft"
              onClick={() => onMockPaymentResult(order.id, "FAILED")}
            >
              Mô phỏng thanh toán thất bại
            </button>
          </div>
        )}

        <p className="demo-warning">
          Đơn hàng và thanh toán hiện chỉ được lưu, mô phỏng trên trình duyệt.
          Chưa gửi đến hệ thống cửa hàng.
        </p>
      </div>

      <div className="confirmation-actions">
        <button className="btn btn-primary" onClick={onShop}>
          Tiếp tục khám phá <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}

function NotFound() {
  return (
    <section className="checkout-empty">
      <h1>Không tìm thấy trang</h1>
      <Link to="/" className="btn btn-primary">
        Về trang chủ
      </Link>
    </section>
  );
}

export default App;
