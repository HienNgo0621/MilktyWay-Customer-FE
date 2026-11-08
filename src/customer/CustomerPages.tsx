import { FormEvent, useState } from "react";
import type {
  Order,
  OrderActionRequest,
  OrderStatus,
  MemberProfile,
  PaymentStatus,
} from "./data";
import { money, demoPromotions, demoMembers, memberTierLabels } from "./data";
import MockOtpStep from "./MockOtpStep";

const statusLabels: Record<OrderStatus, string> = {
  PENDING_CONFIRMATION: "Chờ cửa hàng xác nhận",
  CONFIRMED: "Đã xác nhận",
  PREPARING: "Đang pha chế",
  READY: "Đã pha chế xong",
  DELIVERING: "Đang giao hàng",
  COMPLETED: "Đã hoàn tất",
  CANCEL_REQUESTED: "Đang chờ xử lý yêu cầu hủy",
  CANCELLED: "Đã hủy",
};

const paymentLabels: Record<PaymentStatus, string> = {
  UNPAID: "Chưa thanh toán",
  PENDING: "Đang chờ thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thanh toán thất bại",
  REFUND_PENDING: "Đang chờ hoàn tiền",
  REFUNDED: "Đã hoàn tiền",
};

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN");
}

type OrderTrackingPageProps = {
  orders: Order[];

  onRequestAction: (
    orderId: string,
    type: OrderActionRequest["type"],
    reason: string,
  ) => Order | null;

  onAdvanceOrderStatus: (orderId: string) => Order | null;

  demoMode: boolean;
};

type OrderHistoryPageProps = {
  orders: Order[];
};

type MembershipPageProps = {
  profile: MemberProfile | null;
  onSave: (profile: MemberProfile) => void;
};

export function MembershipPage({ profile, onSave }: MembershipPageProps) {
  const [name, setName] = useState(profile?.name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [message, setMessage] = useState("");

  const normalizedPhone = phone.replace(/\s/g, "");

  const demoProfile = demoMembers.find(
    (member) => member.phone === normalizedPhone,
  );

  const currentProfile = profile ?? demoProfile ?? null;

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!/^0[0-9]{9}$/.test(normalizedPhone)) {
      setMessage("Số điện thoại phải có 10 chữ số và bắt đầu bằng 0.");
      return;
    }

    if (name.trim().length < 2) {
      setMessage("Vui lòng nhập họ tên hợp lệ.");
      return;
    }

    try {
      const nextProfile: MemberProfile = {
        id: currentProfile?.id ?? `MEM-${Date.now()}`,
        name: name.trim(),
        phone: normalizedPhone,
        email: email.trim(),

        points: currentProfile?.points ?? 0,
        tier: currentProfile?.tier ?? "BRONZE",
        discountPercent: currentProfile?.discountPercent ?? 0,
        joinedAt: currentProfile?.joinedAt ?? new Date().toISOString(),

        pointHistory: currentProfile?.pointHistory ?? [],
      };

      onSave(nextProfile);
      setMessage("Thông tin hội viên đã được lưu trong bản demo.");
    } catch (error) {
      console.error("Lỗi khi lưu thông tin hội viên:", error);
      setMessage("Không thể lưu thông tin hội viên.");
    }
  };

  return (
    <section className="feature-page">
      <div className="page-kicker">
        <span className="eyebrow">MILKTYWAY MEMBERSHIP</span>
        <h1>Hội viên MilktyWay</h1>
        <p>Thông tin thành viên, điểm thưởng và ưu đãi của bạn.</p>
      </div>

      {currentProfile && (
        <div className="feature-card member-card">
          <span className="eyebrow">MEMBERSHIP CARD</span>
          <h2>{currentProfile.name}</h2>
          <p>{currentProfile.phone}</p>

          <div className="member-stat-grid">
            <div>
              <small>Điểm thưởng</small>
              <strong>{currentProfile.points.toLocaleString("vi-VN")}</strong>
            </div>

            <div>
              <small>Hạng thành viên</small>
              <strong>{memberTierLabels[currentProfile.tier]}</strong>
            </div>

            <div>
              <small>Ưu đãi</small>
              <strong>{currentProfile.discountPercent}%</strong>
            </div>
          </div>

          <p>Ngày tham gia: {formatDate(currentProfile.joinedAt)}</p>
        </div>
      )}

      <form className="feature-card feature-action-form" onSubmit={handleSave}>
        <h2>
          {currentProfile
            ? "Cập nhật thông tin thành viên"
            : "Đăng ký thành viên demo"}
        </h2>

        <label>
          Họ tên
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            required
          />
        </label>

        <label>
          Số điện thoại
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            type="tel"
            pattern="0[0-9]{9}"
            required
          />
        </label>

        <label>
          Email
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            maxLength={120}
          />
        </label>

        <button className="btn btn-primary" type="submit">
          {currentProfile ? "Lưu thay đổi" : "Đăng ký thành viên"}
        </button>

        {message && <p className="form-feedback">{message}</p>}

        <p className="demo-warning">
          Đây là hồ sơ thành viên mô phỏng trên trình duyệt. Chưa có xác thực số
          điện thoại, OTP hoặc hệ thống tài khoản thật.
        </p>
      </form>

      <div className="feature-card">
        <h2>Ưu đãi dành cho thành viên</h2>

        {demoPromotions
          .filter((promotion) => promotion.memberOnly)
          .map((promotion) => (
            <article className="feature-card-inner" key={promotion.id}>
              <b>{promotion.name}</b>
              <p>{promotion.description}</p>
              <small>Mã: {promotion.code}</small>
            </article>
          ))}

        <h2>Quyền lợi theo hạng</h2>

        <div className="feature-info-grid">
          <div>
            <small>Đồng</small>
            <b>Hạng cơ bản</b>
          </div>
          <div>
            <small>Bạc</small>
            <b>Ưu đãi theo chương trình</b>
          </div>
          <div>
            <small>Vàng</small>
            <b>Ưu đãi thành viên nâng cao</b>
          </div>
          <div>
            <small>VIP</small>
            <b>Quyền lợi đặc biệt</b>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PromotionsPage() {
  const now = new Date();

  const activePromotions = demoPromotions.filter((promotion) => {
    const start = new Date(`${promotion.startDate}T00:00:00`);
    const end = new Date(`${promotion.endDate}T23:59:59`);

    return promotion.active && now >= start && now <= end;
  });

  return (
    <section className="feature-page">
      <div className="page-kicker">
        <span className="eyebrow">SPECIAL OFFERS</span>
        <h1>Khuyến mãi đang áp dụng</h1>
        <p>Khám phá các ưu đãi hiện có tại MilktyWay.</p>
      </div>

      <div className="promotion-grid">
        {activePromotions.length === 0 ? (
          <div className="feature-card feature-empty">
            <h3>Hiện chưa có chương trình khuyến mãi</h3>
            <p>Hãy quay lại sau để cập nhật ưu đãi mới.</p>
          </div>
        ) : (
          activePromotions.map((promotion) => (
            <article className="feature-card promotion-card" key={promotion.id}>
              <span className="eyebrow">
                {promotion.memberOnly ? "MEMBER OFFER" : "SPECIAL OFFER"}
              </span>

              <h2>{promotion.name}</h2>
              <p>{promotion.description}</p>

              <div className="promotion-code">
                <small>Mã ưu đãi</small>
                <b>{promotion.code}</b>
              </div>

              <div className="feature-info-grid">
                <div>
                  <small>Đơn tối thiểu</small>
                  <b>{money(promotion.minimumOrder)}</b>
                </div>

                <div>
                  <small>Giảm tối đa</small>
                  <b>{money(promotion.maximumDiscount)}</b>
                </div>

                <div>
                  <small>Bắt đầu</small>
                  <b>{promotion.startDate}</b>
                </div>

                <div>
                  <small>Kết thúc</small>
                  <b>{promotion.endDate}</b>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export function OrderHistoryPage({ orders }: OrderHistoryPageProps) {
  const [phone, setPhone] = useState("");

  const [otpRequested, setOtpRequested] = useState(false);

  // Chỉ có số điện thoại này sau khi OTP đúng.
  const [verifiedPhone, setVerifiedPhone] = useState("");

  const [error, setError] = useState("");
  // Chỉ lưu ID, không lưu object đơn hàng.
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Luôn lấy object mới nhất từ danh sách orders.
  const selectedOrder = selectedOrderId
    ? (orders.find((order) => order.id === selectedOrderId) ?? null)
    : null;

  const normalizedPhone = phone.replace(/\D/g, "");

  const customerOrders = verifiedPhone
    ? orders.filter((order) => order.phone.replace(/\D/g, "") === verifiedPhone)
    : [];
  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!/^0[0-9]{9}$/.test(normalizedPhone)) {
      setError("Số điện thoại không hợp lệ.");
      return;
    }

    setVerifiedPhone("");
    setOtpRequested(true);
    setError("");
  };
  return (
    <section className="feature-page">
      <div className="page-kicker">
        <span className="eyebrow">PURCHASE HISTORY</span>
        <h1>Lịch sử mua hàng</h1>
        <p>Tra cứu các đơn hàng đã đặt bằng số điện thoại của bạn.</p>
      </div>

      <form
        className="feature-card feature-search-form"
        onSubmit={handleSearch}
      >
        <label>
          Số điện thoại đặt hàng
          <input
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);

              setOtpRequested(false);
              setVerifiedPhone("");
              setSelectedOrderId(null);
              setError("");
            }}
            type="tel"
            pattern="0[0-9]{9}"
            placeholder="09xxxxxxxx"
            required
          />
        </label>

        <button className="btn btn-primary" type="submit">
          Xem lịch sử mua hàng
        </button>
      </form>

      {otpRequested && (
        <MockOtpStep
          onVerified={() => {
            setVerifiedPhone(normalizedPhone);
            setOtpRequested(false);
            setError("");
          }}
          onBack={() => {
            setOtpRequested(false);
            setVerifiedPhone("");
          }}
        />
      )}

      {error && <p className="form-feedback">{error}</p>}

      {verifiedPhone && (
        <div className="feature-card">
          {" "}
          <div className="feature-heading-row">
            <h2>Đơn hàng của bạn</h2>
            <span>{customerOrders.length} đơn hàng</span>
          </div>
          {customerOrders.length === 0 ? (
            <div className="feature-empty">
              <h3>Chưa tìm thấy đơn hàng</h3>
              <p>Không có đơn hàng nào được lưu với số điện thoại này.</p>
            </div>
          ) : (
            customerOrders.map((order) => (
              <article className="history-order-card" key={order.id}>
                <div className="feature-heading-row">
                  <div>
                    <b>{order.id}</b>
                    <small>{formatDate(order.createdAt)}</small>
                  </div>
                  <span className="status-pill">
                    {statusLabels[order.status]}
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
                    <b>{paymentLabels[order.paymentStatus]}</b>
                  </div>
                </div>

                <div className="history-order-actions">
                  <button
                    type="button"
                    className="btn btn-soft btn-small"
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    Xem chi tiết
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      )}
      {selectedOrder && (
        <div
          className="order-modal-backdrop"
          onClick={() => setSelectedOrderId(null)}
        >
          <section
            className="order-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Tiêu đề Modal */}
            <div className="feature-heading-row order-modal-header">
              <div>
                <span className="eyebrow">ORDER DETAILS</span>

                <h2 id="order-modal-title">
                  Chi tiết đơn hàng {selectedOrder.id}
                </h2>

                <p>Ngày đặt: {formatDate(selectedOrder.createdAt)}</p>
              </div>

              <button
                type="button"
                className="order-modal-close"
                aria-label="Đóng cửa sổ chi tiết"
                onClick={() => setSelectedOrderId(null)}
              >
                ×
              </button>
            </div>

            <div className="summary-divider" />

            {/* Thông tin người nhận và đơn hàng */}
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
                <b>{paymentLabels[selectedOrder.paymentStatus]}</b>
              </div>

              <div>
                <small>Trạng thái đơn hàng</small>
                <b>{statusLabels[selectedOrder.status]}</b>
              </div>
            </div>

            {selectedOrder.note && (
              <div className="feature-card-inner">
                <b>Ghi chú của khách hàng</b>
                <p>{selectedOrder.note}</p>
              </div>
            )}

            <div className="summary-divider" />

            {/* Chi tiết sản phẩm */}
            <h3>Chi tiết sản phẩm</h3>

            {selectedOrder.items.map((item) => (
              <div className="feature-order-item" key={item.id}>
                <span>
                  {item.name}

                  <small>
                    {item.detail} · Số lượng: {item.quantity}
                  </small>
                </span>

                <b>{money(item.unitPrice * item.quantity)}</b>
              </div>
            ))}

            <div className="summary-divider" />

            {/* Chi phí */}
            <div className="feature-order-item">
              <span>Tạm tính</span>
              <b>{money(selectedOrder.subtotal)}</b>
            </div>

            <div className="feature-order-item">
              <span>Ưu đãi</span>
              <b>−{money(selectedOrder.discount)}</b>
            </div>

            <div className="feature-order-item">
              <span>Phí giao hàng</span>
              <b>{money(selectedOrder.shipping)}</b>
            </div>

            <div className="summary-total">
              <span>Tổng thanh toán</span>
              <b>{money(selectedOrder.total)}</b>
            </div>

            <div className="summary-divider" />

            {/* Timeline */}
            <h3>Tiến trình đơn hàng</h3>

            <div className="order-timeline">
              {selectedOrder.statusHistory.map((item, index) => (
                <div className="timeline-item" key={`${item.at}-${index}`}>
                  <span className="timeline-dot" />

                  <div>
                    <b>{statusLabels[item.status]}</b>

                    <p>{item.note}</p>

                    <small>{formatDate(item.at)}</small>
                  </div>
                </div>
              ))}
            </div>

            {/* Các yêu cầu đổi hoặc hủy đơn */}
            {selectedOrder.actionRequests.length > 0 && (
              <>
                <div className="summary-divider" />

                <h3>Yêu cầu đổi / hủy đơn</h3>

                {selectedOrder.actionRequests.map((request) => (
                  <div className="feature-card-inner" key={request.id}>
                    <b>
                      {request.type === "CANCEL"
                        ? "Yêu cầu hủy đơn"
                        : "Yêu cầu thay đổi đơn"}
                    </b>

                    <p>{request.reason}</p>

                    <small>Trạng thái yêu cầu: {request.requestStatus}</small>
                  </div>
                ))}
              </>
            )}

            {/* Nút đóng Modal */}
            <div className="history-order-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSelectedOrderId(null)}
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

type ComplaintPageProps = {
  orders: Order[];
  onCreateComplaint: (
    orderId: string,
    phone: string,
    category: string,
    description: string,
  ) => boolean;
};

export function ComplaintPage({
  orders,
  onCreateComplaint,
}: ComplaintPageProps) {
  const [orderCode, setOrderCode] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("Giao thiếu sản phẩm");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!otpVerified) {
      setOtpRequested(true);
      setMessage("Vui lòng xác thực OTP trước khi gửi khiếu nại.");
      return;
    }

    const normalizedCode = orderCode.trim().toUpperCase();
    const normalizedPhone = phone.replace(/\s/g, "");

    const order = orders.find(
      (item) =>
        item.id.toUpperCase() === normalizedCode &&
        item.phone.replace(/\s/g, "") === normalizedPhone,
    );

    if (!order) {
      setMessage("Không tìm thấy đơn hàng tương ứng.");
      return;
    }

    if (description.trim().length < 10) {
      setMessage("Vui lòng mô tả vấn đề ít nhất 10 ký tự.");
      return;
    }

    const success = onCreateComplaint(
      order.id,
      normalizedPhone,
      category,
      description.trim(),
    );

    if (!success) {
      setMessage("Không thể gửi khiếu nại. Vui lòng thử lại.");
      return;
    }

    setMessage("Khiếu nại đã được ghi nhận trong dữ liệu demo.");
    setDescription("");
  };

  return (
    <section className="feature-page">
      <div className="page-kicker">
        <span className="eyebrow">CUSTOMER SUPPORT</span>
        <h1>Gửi khiếu nại</h1>
        <p>
          Hãy cung cấp thông tin đơn hàng và mô tả vấn đề để cửa hàng hỗ trợ.
        </p>
      </div>

      <form
        className="feature-card feature-action-form"
        onSubmit={handleSubmit}
      >
        <label>
          Mã đơn hàng
          <input
            value={orderCode}
            onChange={(event) => setOrderCode(event.target.value)}
            placeholder="IV-12345678"
            required
          />
        </label>

        <label>
          Số điện thoại đặt hàng
          <input
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              setOtpVerified(false);
              setOtpRequested(false);
              setMessage("");
            }}
            type="tel"
            pattern="0[0-9]{9}"
            placeholder="09xxxxxxxx"
            required
          />
        </label>

        <label>
          Loại vấn đề
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option>Giao thiếu sản phẩm</option>
            <option>Giao sai sản phẩm</option>
            <option>Sản phẩm bị hư hỏng</option>
            <option>Chất lượng đồ uống</option>
            <option>Vấn đề thanh toán</option>
            <option>Thái độ phục vụ</option>
            <option>Vấn đề khác</option>
          </select>
        </label>

        <label>
          Nội dung khiếu nại
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            minLength={10}
            maxLength={1000}
            placeholder="Mô tả cụ thể vấn đề bạn gặp phải..."
            required
          />
        </label>

        <button className="btn btn-primary" type="submit">
          Gửi khiếu nại
        </button>

        {message && <p className="form-feedback">{message}</p>}
      </form>
      {otpRequested && (
        <MockOtpStep
          onVerified={() => {
            setOtpVerified(true);
            setOtpRequested(false);
            setMessage("Số điện thoại đã được xác thực.");
          }}
          onBack={() => {
            setOtpRequested(false);
            setOtpVerified(false);
          }}
        />
      )}
    </section>
  );
}

export function OrderTrackingPage({
  orders,
  onRequestAction,
  onAdvanceOrderStatus,
  demoMode,
}: OrderTrackingPageProps) {
  const [orderCode, setOrderCode] = useState("");
  const [phone, setPhone] = useState("");

  // Chỉ lưu ID của đơn hàng được tra cứu.
  const [searchedOrderId, setSearchedOrderId] = useState<string | null>(null);

  // Luôn lấy dữ liệu đơn hàng mới nhất từ props orders.
  const searchedOrder = searchedOrderId
    ? (orders.find((order) => order.id === searchedOrderId) ?? null)
    : null;

  const [error, setError] = useState("");

  const [requestType, setRequestType] =
    useState<OrderActionRequest["type"]>("CANCEL");

  const [reason, setReason] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedPhone = phone.replace(/\D/g, "");

    if (!/^0[0-9]{9}$/.test(normalizedPhone)) {
      setError("Số điện thoại không hợp lệ.");
      return;
    }

    setSearchedOrderId(null);
    setVerifiedPhone("");
    setOtpRequested(true);
    setError("");
  };

  const handleOtpVerified = () => {
    const normalizedCode = orderCode.trim().toUpperCase();
    const normalizedPhone = phone.replace(/\D/g, "");

    const foundOrder = orders.find(
      (order) =>
        order.id.toUpperCase() === normalizedCode &&
        order.phone.replace(/\D/g, "") === normalizedPhone,
    );

    setOtpRequested(false);
    setVerifiedPhone(normalizedPhone);

    if (!foundOrder) {
      setSearchedOrderId(null);
      setError(
        "Không tìm thấy đơn hàng tương ứng với mã đơn và số điện thoại.",
      );
      return;
    }

    setSearchedOrderId(foundOrder.id);
    setReason("");
    setError("");
  };

  const hasPendingRequest =
    searchedOrder?.actionRequests.some(
      (request) => request.requestStatus === "PENDING",
    ) ?? false;

  const canRequestAction =
    searchedOrder !== null &&
    !hasPendingRequest &&
    (searchedOrder.status === "PENDING_CONFIRMATION" ||
      searchedOrder.status === "CONFIRMED");
  const handleRequest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!searchedOrder || !canRequestAction) {
      setError(
        "Đơn hàng hiện không còn trong thời gian có thể yêu cầu đổi hoặc hủy.",
      );
      return;
    }

    if (reason.trim().length < 10) {
      setError("Vui lòng nhập lý do tối thiểu 10 ký tự.");
      return;
    }

    const updatedOrder = onRequestAction(
      searchedOrder.id,
      requestType,
      reason.trim(),
    );

    if (!updatedOrder) {
      setError("Không thể gửi yêu cầu. Vui lòng thử lại.");
      return;
    }

    // Không cần setSearchedOrder nữa.
    // App.tsx đã cập nhật orders.
    // searchedOrder sẽ tự lấy bản mới nhất từ orders.

    setReason("");

    setError(
      requestType === "CANCEL"
        ? "Yêu cầu hủy đơn đã được ghi nhận và đang chờ cửa hàng xử lý."
        : "Yêu cầu thay đổi đơn hàng đã được ghi nhận.",
    );
  };

  const handleDemoAdvance = () => {
    if (!searchedOrder) {
      return;
    }

    const updatedOrder = onAdvanceOrderStatus(searchedOrder.id);

    if (!updatedOrder) {
      return;
    }

    // Không giữ lại object cũ trong state.
    // React render lại dựa trên orders đã được App.tsx cập nhật.

    setError("");
  };

  return (
    <section className="feature-page">
      <div className="page-kicker">
        <span className="eyebrow">ORDER TRACKING</span>
        <h1>Tra cứu đơn hàng</h1>
        <p>Nhập mã đơn hàng và số điện thoại đã sử dụng khi đặt hàng.</p>
      </div>

      <form
        className="feature-card feature-search-form"
        onSubmit={handleSearch}
      >
        <label>
          Mã đơn hàng
          <input
            value={orderCode}
            onChange={(event) => {
              setOrderCode(event.target.value);
              setSearchedOrderId(null);
              setOtpRequested(false);
              setVerifiedPhone("");
              setError("");
            }}
            placeholder="Ví dụ: IV-12345678"
            required
          />
        </label>

        <label>
          Số điện thoại đặt hàng
          <input
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              setSearchedOrderId(null);
              setOtpRequested(false);
              setVerifiedPhone("");
              setError("");
            }}
            placeholder="09xxxxxxxx"
            type="tel"
            pattern="0[0-9]{9}"
            required
          />
        </label>

        <button className="btn btn-primary" type="submit">
          Tra cứu đơn hàng
        </button>

        {error && <p className="form-feedback">{error}</p>}
      </form>

      {otpRequested && (
        <MockOtpStep
          onVerified={handleOtpVerified}
          onBack={() => {
            setOtpRequested(false);
            setVerifiedPhone("");
          }}
        />
      )}

      {searchedOrder && (
        <div className="feature-card order-detail-card">
          <div className="feature-heading-row">
            <div>
              <span className="eyebrow">ORDER DETAILS</span>
              <h2>{searchedOrder.id}</h2>
              <p>Ngày đặt: {formatDate(searchedOrder.createdAt)}</p>
            </div>

            <strong className="status-pill">
              {statusLabels[searchedOrder.status]}
            </strong>
          </div>

          <div className="feature-info-grid">
            <div>
              <small>Người nhận</small>
              <b>{searchedOrder.name}</b>
            </div>
            <div>
              <small>Số điện thoại</small>
              <b>{searchedOrder.phone}</b>
            </div>
            <div>
              <small>Chi nhánh</small>
              <b>{searchedOrder.branchName}</b>
            </div>
            <div>
              <small>Thanh toán</small>
              <b>{paymentLabels[searchedOrder.paymentStatus]}</b>
            </div>
          </div>

          <h3>Tiến trình đơn hàng</h3>

          <div className="order-timeline">
            {searchedOrder.statusHistory.map((item, index) => (
              <div className="timeline-item" key={`${item.at}-${index}`}>
                <span className="timeline-dot" />
                <div>
                  <b>{statusLabels[item.status]}</b>
                  <p>{item.note}</p>
                  <small>{formatDate(item.at)}</small>
                </div>
              </div>
            ))}
          </div>

          {demoMode &&
            searchedOrder.status !== "COMPLETED" &&
            searchedOrder.status !== "CANCELLED" && (
              <div className="demo-step-panel">
                <div>
                  <b>Demo trạng thái đơn hàng</b>

                  <p>Bấm nút để mô phỏng bước xử lý tiếp theo của cửa hàng.</p>
                </div>

                <button
                  type="button"
                  className="btn btn-soft"
                  onClick={handleDemoAdvance}
                >
                  {searchedOrder.status === "CANCEL_REQUESTED"
                    ? "Demo: Cửa hàng xác nhận hủy"
                    : "Demo Next Step"}
                </button>
              </div>
            )}

          <div className="summary-divider" />

          <h3>Chi tiết sản phẩm</h3>

          {searchedOrder.items.map((item) => (
            <div className="feature-order-item" key={item.id}>
              <span>
                {item.quantity} × {item.name}
                <small>{item.detail}</small>
              </span>
              <b>{money(item.quantity * item.unitPrice)}</b>
            </div>
          ))}

          <div className="summary-total">
            <span>Tổng thanh toán</span>
            <b>{money(searchedOrder.total)}</b>
          </div>

          {canRequestAction && (
            <form className="feature-action-form" onSubmit={handleRequest}>
              <h3>Yêu cầu đổi hoặc hủy đơn</h3>

              <label>
                Loại yêu cầu
                <select
                  value={requestType}
                  onChange={(event) =>
                    setRequestType(
                      event.target.value as OrderActionRequest["type"],
                    )
                  }
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
                  placeholder="Nhập lý do bạn muốn thay đổi hoặc hủy đơn..."
                  required
                />
              </label>

              <button className="btn btn-primary" type="submit">
                Gửi yêu cầu
              </button>

              <p className="form-feedback">
                Yêu cầu chỉ được ghi nhận. Cửa hàng cần xác nhận trước khi đơn
                hàng thực sự được thay đổi hoặc hủy.
              </p>
            </form>
          )}

          {searchedOrder.actionRequests.length > 0 && (
            <div className="feature-request-list">
              <h3>Yêu cầu đã gửi</h3>
              {searchedOrder.actionRequests.map((request) => (
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
            </div>
          )}
        </div>
      )}
    </section>
  );
}
