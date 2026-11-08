import { useState } from "react";
import type { FormEvent } from "react";

type Props = {
  onVerified: () => void;
  onBack: () => void;
};

export default function MockOtpStep({ onVerified, onBack }: Props) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const handleVerify = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!/^[0-9]{6}$/.test(otp)) {
      setError("Mã OTP phải gồm đúng 6 chữ số.");
      return;
    }

    if (otp !== "123456") {
      setError("Mã OTP không chính xác. Vui lòng thử lại.");
      return;
    }

    setError("");
    onVerified();
  };

  return (
    <form
      className="feature-card otp-verification-card"
      onSubmit={handleVerify}
    >
      <span className="eyebrow">PHONE VERIFICATION</span>

      <h2>Xác thực số điện thoại</h2>

      <p>Vui lòng nhập mã OTP để tiếp tục xem thông tin.</p>

      <div className="otp-demo-code">
        Mã OTP test của bạn là:
        <strong>123456</strong>
      </div>

      <label>
        Mã OTP gồm 6 chữ số
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={otp}
          onChange={(event) => {
            setOtp(event.target.value.replace(/\D/g, ""));
            setError("");
          }}
          placeholder="Nhập 123456"
          required
        />
      </label>

      {error && <p className="payment-failed-description">{error}</p>}

      <button type="submit" className="btn btn-primary full-width">
        Xác thực OTP
      </button>

      <button
        type="button"
        className="btn btn-soft full-width"
        onClick={onBack}
      >
        Quay lại sửa số điện thoại
      </button>
    </form>
  );
}
