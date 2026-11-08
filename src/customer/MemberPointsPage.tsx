import { useState } from "react";
import type { MemberProfile } from "./data";
import { memberTierLabels } from "./data";
import { money } from "./data";
import MockOtpStep from "./MockOtpStep";
import type { FormEvent } from "react";

type Props = {
  members: MemberProfile[];
};

export default function MemberPointsPage({ members }: Props) {
  const [phone, setPhone] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [error, setError] = useState("");

  const normalizedPhone = phone.replace(/\D/g, "");

  const member = verifiedPhone
    ? (members.find(
        (item) => item.phone.replace(/\D/g, "") === verifiedPhone,
      ) ?? null)
    : null;

  const handleLookup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!/^0[0-9]{9}$/.test(normalizedPhone)) {
      setError("Số điện thoại phải có 10 chữ số.");
      return;
    }

    setVerifiedPhone("");
    setOtpRequested(true);
    setError("");
  };

  return (
    <section className="feature-page">
      <div className="page-kicker">
        <span className="eyebrow">MEMBER REWARDS</span>
        <h1>Tra cứu điểm thưởng</h1>
        <p>
          Xem số dư điểm, hạng thành viên và lịch sử cộng/trừ điểm MilktyWay.
        </p>
      </div>

      <form
        className="feature-card feature-search-form"
        onSubmit={handleLookup}
      >
        <label>
          Số điện thoại hội viên
          <input
            type="tel"
            value={phone}
            pattern="0[0-9]{9}"
            maxLength={10}
            placeholder="Nhập SĐT đăng ký hội viên"
            required
            onChange={(event) => {
              setPhone(event.target.value);
              setOtpRequested(false);
              setVerifiedPhone("");
              setError("");
            }}
          />
        </label>

        <button type="submit" className="btn btn-primary">
          Tra cứu điểm thưởng
        </button>

        {error && <p className="form-feedback">{error}</p>}
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

      {verifiedPhone && !member && (
        <div className="feature-card feature-empty">
          <h3>Không tìm thấy hội viên</h3>
          <p>Số điện thoại này chưa được đăng ký hội viên MilktyWay.</p>
        </div>
      )}

      {member && (
        <>
          <div className="feature-card member-points-card">
            <span className="eyebrow">MEMBERSHIP ACCOUNT</span>

            <h2>{member.name}</h2>

            <p>{member.phone}</p>

            <div className="member-stat-grid">
              <div>
                <small>Điểm hiện có</small>
                <strong>{member.points.toLocaleString("vi-VN")}</strong>
              </div>

              <div>
                <small>Hạng thành viên</small>
                <strong>{memberTierLabels[member.tier]}</strong>
              </div>

              <div>
                <small>Ưu đãi hiện tại</small>
                <strong>{member.discountPercent}%</strong>
              </div>
            </div>

            <p>
              Ngày tham gia:{" "}
              {new Date(member.joinedAt).toLocaleDateString("vi-VN")}
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-heading-row">
              <h2>Lịch sử điểm thưởng</h2>
              <span>{(member.pointHistory ?? []).length} giao dịch</span>
            </div>

            {(member.pointHistory ?? []).length === 0 ? (
              <div className="feature-empty">
                <h3>Chưa có giao dịch điểm</h3>
                <p>Các giao dịch tích và đổi điểm sẽ được hiển thị tại đây.</p>
              </div>
            ) : (
              member.pointHistory!.map((transaction) => (
                <article className="point-history-item" key={transaction.id}>
                  <div>
                    <b>{transaction.description}</b>

                    <small>
                      {new Date(transaction.createdAt).toLocaleString("vi-VN")}
                    </small>

                    {transaction.orderId && (
                      <small>Mã đơn: {transaction.orderId}</small>
                    )}
                  </div>

                  <strong
                    className={
                      transaction.points >= 0
                        ? "point-positive"
                        : "point-negative"
                    }
                  >
                    {transaction.points > 0 ? "+" : ""}
                    {transaction.points.toLocaleString("vi-VN")}
                  </strong>
                </article>
              ))
            )}
          </div>

          <div className="feature-card">
            <h2>Quy đổi điểm thưởng</h2>
            <p>
              1 điểm = {money(1000)} khi sử dụng để giảm trực tiếp vào đơn hàng.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
