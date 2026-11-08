
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { Order } from "./data";

export type PaymentSession = {
  orderId: string;
  expiresAt: number;
  status: "PENDING" | "FAILED";
  failureReason?: string;
};

type Props = {
  order: Order;
  session: PaymentSession;
  onExpired: () => void;
  onCancel: () => void;
  onSuccess: () => void;
  onRetry: () => void;
  onChooseOtherMethod: () => void;
};

export default function PaymentQrModal({
  order,
  session,
  onExpired,
  onCancel,
  onSuccess,
  onRetry,
  onChooseOtherMethod,
}: Props) {
  const [secondsLeft, setSecondsLeft] = useState(
    Math.max(
      0,
      Math.ceil((session.expiresAt - Date.now()) / 1000)
    )
  );

  useEffect(() => {
    if (session.status !== "PENDING") return;

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((session.expiresAt - Date.now()) / 1000)
      );

      setSecondsLeft(remaining);

      if (remaining === 0) {
        window.clearInterval(timer);
        onExpired();
      }
    };

    const timer = window.setInterval(tick, 1000);

    tick();

    return () => window.clearInterval(timer);
  }, [session.expiresAt, session.status, onExpired]);

  const minutes = String(
    Math.floor(secondsLeft / 60)
  ).padStart(2, "0");

  const seconds = String(
    secondsLeft % 60
  ).padStart(2, "0");

  const paymentProvider =
    order.paymentMethod === "MOMO"
      ? "MOMO"
      : "BANK_TRANSFER";

  // Đây là QR mã hóa dữ liệu demo, không phải QR nhận tiền thật.
  const qrValue = [
    "MILKTYWAY-DEMO",
    paymentProvider,
    order.id,
    order.total,
  ].join("|");

  return (
    <div className="payment-modal-backdrop">
      <section
        className="payment-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
      >
        {session.status === "PENDING" ? (
          <>
            <h2 id="payment-modal-title">
              Thanh toán đơn hàng
            </h2>

            <p className="payment-modal-description">
              Quét mã QR bên dưới để mô phỏng thanh toán.
            </p>

            <div className="payment-qr">
              <QRCodeSVG
                value={qrValue}
                size={220}
                level="M"
                includeMargin
              />
            </div>

            <p>
              Mã đơn hàng: <b>{order.id}</b>
            </p>

            <p>
              Số tiền: <b>{order.total.toLocaleString("vi-VN")}đ</b>
            </p>

            <div className="payment-countdown">
              Thời gian còn lại
              <strong>
                {minutes}:{seconds}
              </strong>
            </div>

            <p className="payment-demo-note">
              Đây là QR demo. Chưa kết nối MoMo, ngân hàng
              hoặc hệ thống thanh toán thực tế.
            </p>

            <button
              type="button"
              className="btn btn-primary full-width"
              onClick={onSuccess}
            >
              Mô phỏng đã thanh toán thành công
            </button>

            <button
              type="button"
              className="btn btn-soft full-width"
              onClick={onCancel}
            >
              Hủy thanh toán
            </button>
          </>
        ) : (
          <>
            <div className="payment-failed-icon">!</div>

            <h2
              id="payment-modal-title"
              className="payment-failed-title"
            >
              Thanh toán thất bại
            </h2>

            <p className="payment-failed-description">
              {session.failureReason ||
                "Giao dịch đã bị hủy hoặc hết thời gian thanh toán."}
            </p>

            <p>
              Đơn hàng <b>{order.id}</b> vẫn được lưu.
              Sản phẩm chưa bị xóa khỏi giỏ hàng.
            </p>

            <button
              type="button"
              className="btn btn-primary full-width"
              onClick={onRetry}
            >
              Thử thanh toán lại
            </button>

            <button
              type="button"
              className="btn btn-soft full-width"
              onClick={onChooseOtherMethod}
            >
              Chọn phương thức khác
            </button>
          </>
        )}
      </section>
    </div>
  );
}
