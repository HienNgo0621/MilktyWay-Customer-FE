import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { X } from "lucide-react";

import type {
  MemberProfile,
  Order,
  OrderActionRequest,
  OrderStatus,
  PaymentStatus,
} from "./data";

import { memberTierLabels, money } from "./data";

import MockOtpStep from "./MockOtpStep";

type Props = {
  orders: Order[];
  members: MemberProfile[];

  onRequestAction: (
    orderId: string,
    type: OrderActionRequest["type"],
    reason: string,
  ) => Order | null;

  onAdvanceOrderStatus: (orderId: string) => Order | null;

  demoMode: boolean;
};

type OrderTab = "PROCESSING" | "COMPLETED" | "CANCELLED";

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_CONFIRMATION: "Chờ cửa hàng xác nhận",
  CONFIRMED: "Đã xác nhận",
  PREPARING: "Đang pha chế",
  READY: "Đã pha chế xong",
  DELIVERING: "Đang giao hàng",
  COMPLETED: "Đã hoàn tất",
  CANCEL_REQUESTED: "Đang chờ xử lý yêu cầu hủy",
  CANCELLED: "Đã hủy",
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Chưa thanh toán",
  PENDING: "Đang chờ thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thanh toán thất bại",
  REFUND_PENDING: "Đang chờ hoàn tiền",
  REFUNDED: "Đã hoàn tiền",
};

const TAB_ITEMS: {
  key: OrderTab;
  label: string;
}[] = [
  {
    key: "PROCESSING",
    label: "Đơn đang xử lý",
  },
  {
    key: "COMPLETED",
    label: "Đơn hoàn tất",
  },
  {
    key: "CANCELLED",
    label: "Đơn đã hủy",
  },
];

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN");
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

// Kiểm tra đơn hàng thuộc SĐT người dùng đang tra cứu.
// Hỗ trợ cả SĐT người nhận và SĐT hội viên.
function isOrderForPhone(order: Order, phone: string): boolean {
  const recipientPhone = normalizePhone(order.phone);

  const memberPhone = normalizePhone(order.memberPhone ?? "");

  return recipientPhone === phone || memberPhone === phone;
}

function getOrderTab(status: OrderStatus): OrderTab {
  if (status === "COMPLETED") {
    return "COMPLETED";
  }

  if (status === "CANCELLED") {
    return "CANCELLED";
  }

  // CANCEL_REQUESTED vẫn đang chờ cửa hàng xử lý.
  return "PROCESSING";
}

export default function TraCuuPage({
  orders,
  members,
  onRequestAction,
  onAdvanceOrderStatus,
  demoMode,
}: Props) {
  const [phone, setPhone] = useState("");

  const [otpRequested, setOtpRequested] = useState(false);

  // Chỉ có giá trị sau khi OTP đúng.
  const [verifiedPhone, setVerifiedPhone] = useState("");

  const [activeTab, setActiveTab] = useState<OrderTab>("PROCESSING");

  // Chỉ lưu ID để luôn lấy đơn hàng mới nhất từ props.
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const [requestType, setRequestType] =
    useState<OrderActionRequest["type"]>("CANCEL");

  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  const normalizedPhone = normalizePhone(phone);

  // ==========================================
  // 1. TÌM HỘI VIÊN SAU KHI OTP THÀNH CÔNG
  // ==========================================

  const member = useMemo(() => {
    if (!verifiedPhone) {
      return null;
    }

    return (
      members.find((item) => normalizePhone(item.phone) === verifiedPhone) ??
      null
    );
  }, [members, verifiedPhone]);

  // ==========================================
  // 2. TÌM CÁC ĐƠN HÀNG THEO SĐT
  // ==========================================

  const customerOrders = useMemo(() => {
    if (!verifiedPhone) {
      return [];
    }

    return orders.filter((order) => isOrderForPhone(order, verifiedPhone));
  }, [orders, verifiedPhone]);

  // ==========================================
  // 3. LỌC ĐƠN THEO TAB
  // ==========================================

  const orderCounts: Record<OrderTab, number> = {
    PROCESSING: customerOrders.filter(
      (order) => getOrderTab(order.status) === "PROCESSING",
    ).length,

    COMPLETED: customerOrders.filter(
      (order) => getOrderTab(order.status) === "COMPLETED",
    ).length,

    CANCELLED: customerOrders.filter(
      (order) => getOrderTab(order.status) === "CANCELLED",
    ).length,
  };

  const visibleOrders = customerOrders.filter(
    (order) => getOrderTab(order.status) === activeTab,
  );

  // ==========================================
  // 4. ĐƠN HÀNG ĐANG MỞ CHI TIẾT
  // ==========================================

  const selectedOrder = selectedOrderId
    ? (orders.find(
        (order) =>
          order.id === selectedOrderId &&
          verifiedPhone &&
          isOrderForPhone(order, verifiedPhone),
      ) ?? null)
    : null;

  const hasPendingRequest =
    selectedOrder?.actionRequests.some(
      (item) => item.requestStatus === "PENDING",
    ) ?? false;

  const canRequestAction =
    selectedOrder !== null &&
    !hasPendingRequest &&
    (selectedOrder.status === "PENDING_CONFIRMATION" ||
      selectedOrder.status === "CONFIRMED");

  // ==========================================
  // 5. GỬI SỐ ĐIỆN THOẠI ĐỂ XÁC THỰC OTP
  // ==========================================

  const handleLookup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!/^0[0-9]{9}$/.test(normalizedPhone)) {
      setMessage("Số điện thoại phải có 10 chữ số.");
      return;
    }

    // Xóa kết quả xác thực trước đó.
    setVerifiedPhone("");
    setSelectedOrderId(null);
    setOtpRequested(true);
    setActiveTab("PROCESSING");
    setMessage("");
  };

  // ==========================================
  // 6. SAU KHI OTP ĐÚNG
  // ==========================================

  const handleOtpVerified = () => {
    setVerifiedPhone(normalizedPhone);
    setOtpRequested(false);
    setActiveTab("PROCESSING");
    setMessage("");
  };

  // ==========================================
  // 7. GỬI YÊU CẦU ĐỔI / HỦY ĐƠN
  // ==========================================

  const handleRequestAction = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedOrder || !canRequestAction) {
      setMessage("Đơn hàng hiện không thể yêu cầu đổi hoặc hủy.");
      return;
    }

    if (reason.trim().length < 10) {
      setMessage("Vui lòng nhập lý do tối thiểu 10 ký tự.");
      return;
    }

    if (requestType === "CANCEL") {
      const createdAt = new Date(selectedOrder.createdAt).getTime();

      const elapsed = Date.now() - createdAt;
      const fiveMinutes = 5 * 60 * 1000;

      if (!Number.isFinite(createdAt) || elapsed < 0 || elapsed > fiveMinutes) {
        setMessage(
          "Yêu cầu hủy chỉ được gửi trong vòng 5 phút kể từ khi đặt hàng.",
        );
        return;
      }
    }

    const updatedOrder = onRequestAction(
      selectedOrder.id,
      requestType,
      reason.trim(),
    );

    if (!updatedOrder) {
      setMessage("Không thể gửi yêu cầu. Vui lòng thử lại.");
      return;
    }

    setReason("");

    setMessage(
      requestType === "CANCEL"
        ? "Yêu cầu hủy đã được gửi và đang chờ cửa hàng xử lý."
        : "Yêu cầu thay đổi đơn hàng đã được ghi nhận.",
    );
  };

  // ==========================================
  // 8. DEMO CHUYỂN TRẠNG THÁI ĐƠN HÀNG
  // ==========================================

  const handleDemoAdvance = () => {
    if (!selectedOrder) {
      return;
    }

    const updatedOrder = onAdvanceOrderStatus(selectedOrder.id);

    if (!updatedOrder) {
      setMessage("Không thể cập nhật trạng thái đơn hàng.");
      return;
    }

    setMessage("Đã cập nhật trạng thái đơn hàng trong dữ liệu demo.");
  };

  // ==========================================
  // 9. GIAO DIỆN
  // ==========================================

  const recentPointHistory = member
    ? [...(member.pointHistory ?? [])]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5)
    : [];

  return (
    <section className="feature-page tra-cuu-page">
      <div className="page-kicker">
        <span className="eyebrow">MILKTYWAY LOOKUP CENTER</span>

        <h1>Tra cứu thông tin</h1>

        <p>
          Tra cứu lịch sử mua hàng, theo dõi đơn hàng và kiểm tra điểm thưởng
          hội viên.
        </p>
      </div>

      {/* FORM NHẬP SĐT */}
      <form
        className="feature-card tra-cuu-search-form"
        onSubmit={handleLookup}
      >
        <label>
          Số điện thoại
          <input
            type="tel"
            value={phone}
            pattern="0[0-9]{9}"
            maxLength={10}
            placeholder="Nhập số điện thoại đã đặt hàng"
            autoComplete="tel"
            required
            onChange={(event) => {
              setPhone(event.target.value);

              // Đổi SĐT phải xác thực lại OTP.
              setVerifiedPhone("");
              setOtpRequested(false);
              setSelectedOrderId(null);
              setActiveTab("PROCESSING");
              setMessage("");
            }}
          />
        </label>

        <button type="submit" className="btn btn-primary">
          Tra cứu
        </button>
      </form>

      {message && !selectedOrder && <p className="form-feedback">{message}</p>}

      {/* XÁC THỰC OTP */}
      {otpRequested && (
        <MockOtpStep
          onVerified={handleOtpVerified}
          onBack={() => {
            setOtpRequested(false);
            setVerifiedPhone("");
          }}
        />
      )}

      {/* KẾT QUẢ CHỈ ĐƯỢC HIỂN THỊ SAU OTP */}
      {verifiedPhone && (
        <>
          {/* ====================================
              TRƯỜNG HỢP 1: LÀ HỘI VIÊN
          ==================================== */}

          {member && (
            <section className="feature-card tra-cuu-member-card">
              <div className="feature-heading-row">
                <div>
                  <span className="eyebrow">MEMBERSHIP ACCOUNT</span>

                  <h2>{member.name}</h2>

                  <p>{member.phone}</p>
                </div>

                <span className="tra-cuu-tier-badge">
                  {memberTierLabels[member.tier]}
                </span>
              </div>

              <div className="member-stat-grid">
                <div>
                  <small>Hạng thành viên</small>
                  <strong>{memberTierLabels[member.tier]}</strong>
                </div>

                <div>
                  <small>Điểm tích lũy hiện có</small>
                  <strong>{member.points.toLocaleString("vi-VN")}</strong>
                </div>
              </div>

              <div className="tra-cuu-point-history">
                <div className="feature-heading-row">
                  <h3>Lịch sử điểm gần đây</h3>

                  <span>{(member.pointHistory ?? []).length} giao dịch</span>
                </div>

                {recentPointHistory.length === 0 ? (
                  <p className="form-feedback">
                    Hội viên chưa có giao dịch điểm.
                  </p>
                ) : (
                  recentPointHistory.map((item) => (
                    <div className="tra-cuu-point-row" key={item.id}>
                      <div>
                        <b>{item.description}</b>

                        <small>{formatDate(item.createdAt)}</small>

                        {item.orderId && <small>Mã đơn: {item.orderId}</small>}
                      </div>

                      <strong
                        className={
                          item.points >= 0 ? "point-positive" : "point-negative"
                        }
                      >
                        {item.points > 0 ? "+" : ""}
                        {item.points.toLocaleString("vi-VN")}
                      </strong>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {/* ====================================
              DANH SÁCH ĐƠN HÀNG CHO CẢ HAI NHÓM
          ==================================== */}

          <section className="feature-card tra-cuu-orders-card">
            <div className="feature-heading-row">
              <div>
                <span className="eyebrow">ORDER HISTORY & TRACKING</span>

                <h2>Đơn hàng của bạn</h2>
              </div>

              <span>{customerOrders.length} đơn hàng</span>
            </div>

            {/* 3 TAB TRẠNG THÁI */}
            <div
              className="tra-cuu-tabs"
              role="tablist"
              aria-label="Lọc đơn hàng theo trạng thái"
            >
              {TAB_ITEMS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  className={
                    activeTab === tab.key ? "tra-cuu-tab active" : "tra-cuu-tab"
                  }
                  onClick={() => setActiveTab(tab.key)}
                >
                  <span>{tab.label}</span>
                  <b>{orderCounts[tab.key]}</b>
                </button>
              ))}
            </div>

            {/* DANH SÁCH ĐƠN */}
            <div className="tra-cuu-order-list">
              {visibleOrders.length === 0 ? (
                <div className="feature-empty">
                  <h3>
                    {customerOrders.length === 0
                      ? "Chưa tìm thấy đơn hàng"
                      : "Không có đơn hàng trong mục này"}
                  </h3>

                  <p>
                    {customerOrders.length === 0
                      ? "Số điện thoại này chưa có đơn hàng trong dữ liệu demo."
                      : "Các đơn hàng thuộc trạng thái này sẽ xuất hiện tại đây."}
                  </p>
                </div>
              ) : (
                visibleOrders.map((order) => (
                  <article
                    className="history-order-card tra-cuu-order-card"
                    key={order.id}
                  >
                    <div className="feature-heading-row">
                      <div>
                        <b>{order.id}</b>

                        <small>{formatDate(order.createdAt)}</small>
                      </div>

                      <span className="status-pill">
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </div>

                    <div className="feature-order-item">
                      <span>{order.items.length} loại sản phẩm</span>

                      <b>{money(order.total)}</b>
                    </div>

                    <div className="feature-info-grid">
                      <div>
                        <small>Chi nhánh</small>
                        <b>{order.branchName}</b>
                      </div>

                      <div>
                        <small>Thanh toán</small>
                        <b>{PAYMENT_STATUS_LABELS[order.paymentStatus]}</b>
                      </div>
                    </div>

                    <div className="history-order-actions">
                      <button
                        type="button"
                        className="btn btn-soft btn-small"
                        onClick={() => {
                          setSelectedOrderId(order.id);
                          setMessage("");
                        }}
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </>
      )}

      {/* ========================================
          MODAL CHI TIẾT ĐƠN HÀNG
      ======================================== */}

      {selectedOrder && (
        <div
          className="order-modal-backdrop"
          onClick={() => {
            setSelectedOrderId(null);
            setMessage("");
          }}
        >
          <section
            className="order-modal tra-cuu-order-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tra-cuu-order-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="feature-heading-row order-modal-header">
              <div>
                <span className="eyebrow">ORDER DETAILS</span>

                <h2 id="tra-cuu-order-title">
                  Chi tiết đơn hàng {selectedOrder.id}
                </h2>

                <p>Ngày đặt: {formatDate(selectedOrder.createdAt)}</p>
              </div>

              <button
                type="button"
                className="order-modal-close"
                aria-label="Đóng"
                onClick={() => {
                  setSelectedOrderId(null);
                  setMessage("");
                }}
              >
                <X size={19} />
              </button>
            </div>

            <div className="summary-divider" />

            <h3>Thông tin đơn hàng</h3>

            <div className="feature-info-grid">
              <div>
                <small>Người nhận</small>
                <b>{selectedOrder.name}</b>
              </div>

              <div>
                <small>Số điện thoại</small>
                <b>{selectedOrder.phone}</b>
              </div>

              <div>
                <small>Địa chỉ giao hàng</small>
                <b>{selectedOrder.address}</b>
              </div>

              <div>
                <small>Chi nhánh</small>
                <b>{selectedOrder.branchName}</b>
              </div>

              <div>
                <small>Phương thức thanh toán</small>
                <b>{selectedOrder.payment}</b>
              </div>

              <div>
                <small>Trạng thái thanh toán</small>
                <b>{PAYMENT_STATUS_LABELS[selectedOrder.paymentStatus]}</b>
              </div>

              <div>
                <small>Trạng thái đơn hàng</small>
                <b>{ORDER_STATUS_LABELS[selectedOrder.status]}</b>
              </div>
            </div>

            {selectedOrder.note && (
              <div className="feature-card-inner">
                <b>Ghi chú</b>
                <p>{selectedOrder.note}</p>
              </div>
            )}

            <div className="summary-divider" />

            <h3>Chi tiết sản phẩm</h3>

            {selectedOrder.items.map((item) => (
              <div className="feature-order-item" key={item.id}>
                <span>
                  {item.quantity} × {item.name}
                  <small>{item.detail}</small>
                </span>

                <b>{money(item.unitPrice * item.quantity)}</b>
              </div>
            ))}

            <div className="summary-divider" />

            <div className="feature-order-item">
              <span>Tạm tính</span>
              <b>{money(selectedOrder.subtotal)}</b>
            </div>

            {selectedOrder.discount > 0 && (
              <div className="feature-order-item">
                <span>Tổng giảm trừ</span>
                <b>−{money(selectedOrder.discount)}</b>
              </div>
            )}

            {selectedOrder.pointsUsed ? (
              <div className="feature-order-item">
                <span>Điểm đã sử dụng</span>

                <b>{selectedOrder.pointsUsed.toLocaleString("vi-VN")}</b>
              </div>
            ) : null}

            <div className="feature-order-item">
              <span>Phí giao hàng</span>
              <b>{money(selectedOrder.shipping)}</b>
            </div>

            <div className="summary-total">
              <span>Tổng thanh toán</span>
              <b>{money(selectedOrder.total)}</b>
            </div>

            <div className="summary-divider" />

            {/* TIMELINE */}
            <h3>Tiến trình đơn hàng</h3>

            <div className="order-timeline">
              {selectedOrder.statusHistory.map((item, index) => (
                <div className="timeline-item" key={`${item.at}-${index}`}>
                  <span className="timeline-dot" />

                  <div>
                    <b>{ORDER_STATUS_LABELS[item.status]}</b>

                    <p>{item.note}</p>

                    <small>{formatDate(item.at)}</small>
                  </div>
                </div>
              ))}
            </div>

            {/* YÊU CẦU ĐỔI / HỦY */}
            {(selectedOrder.actionRequests ?? []).length > 0 && (
              <>
                <div className="summary-divider" />

                <h3>Yêu cầu đổi / hủy đơn</h3>

                {selectedOrder.actionRequests.map((request) => (
                  <div className="feature-card-inner" key={request.id}>
                    <b>
                      {request.type === "CANCEL"
                        ? "Yêu cầu hủy đơn"
                        : "Yêu cầu đổi đơn"}
                    </b>

                    <p>{request.reason}</p>

                    <small>Trạng thái: {request.requestStatus}</small>
                  </div>
                ))}
              </>
            )}

            {/* GỬI YÊU CẦU MỚI */}
            {canRequestAction && (
              <form
                className="feature-action-form"
                onSubmit={handleRequestAction}
              >
                <div className="summary-divider" />

                <h3>Yêu cầu đổi hoặc hủy đơn</h3>

                <label>
                  Loại yêu cầu
                  <select
                    value={requestType}
                    onChange={(event) => {
                      setRequestType(
                        event.target.value as OrderActionRequest["type"],
                      );
                    }}
                  >
                    <option value="CANCEL">Yêu cầu hủy đơn hàng</option>

                    <option value="CHANGE">Yêu cầu thay đổi đơn hàng</option>
                  </select>
                </label>

                <label>
                  Lý do
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    minLength={10}
                    maxLength={500}
                    placeholder="Nhập lý do tối thiểu 10 ký tự..."
                    required
                  />
                </label>

                <button type="submit" className="btn btn-primary">
                  Gửi yêu cầu
                </button>

                <p className="form-feedback">
                  Yêu cầu hủy chỉ được gửi trong vòng 5 phút kể từ khi đặt. Cửa
                  hàng cần xác nhận trước khi đơn thực sự chuyển sang Đã hủy.
                </p>
              </form>
            )}

            {/* DEMO NEXT STEP */}
            {demoMode &&
              selectedOrder.status !== "COMPLETED" &&
              selectedOrder.status !== "CANCELLED" && (
                <div className="demo-step-panel">
                  <div>
                    <b>Demo trạng thái đơn hàng</b>

                    <p>Mô phỏng cửa hàng chuyển đơn sang bước tiếp theo.</p>
                  </div>

                  <button
                    type="button"
                    className="btn btn-soft"
                    onClick={handleDemoAdvance}
                  >
                    {selectedOrder.status === "CANCEL_REQUESTED"
                      ? "Demo: Xác nhận hủy"
                      : "Demo Next Step"}
                  </button>
                </div>
              )}

            {message && <p className="form-feedback">{message}</p>}

            <div className="history-order-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setSelectedOrderId(null);
                  setMessage("");
                }}
              >
                Đóng
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
