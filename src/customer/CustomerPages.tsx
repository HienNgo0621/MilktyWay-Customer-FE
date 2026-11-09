import { useState } from "react";
import type { FormEvent } from "react";
import type { Order } from "./data";
import MockOtpStep from "./MockOtpStep";

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!otpVerified) {
      setOtpRequested(true);
      setMessage("Vui lòng xác thực OTP trước khi gửi khiếu nại.");
      return;
    }

    const normalizedCode = orderCode.trim().toUpperCase();
    const normalizedPhone = phone.replace(/\D/g, "");

    const order = orders.find(
      (item) =>
        item.id.toUpperCase() === normalizedCode &&
        item.phone.replace(/\D/g, "") === normalizedPhone,
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
            onChange={(event) => {
              setOrderCode(event.target.value);
              setOtpVerified(false);
              setOtpRequested(false);
              setMessage("");
            }}
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
