import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

const faqItems = [
  {
    id: 1,
    question: "Cửa hàng có giao hàng tận nơi không?",
    answer:
      "MilktyWay giao hàng trong bán kính 5km từ chi nhánh phục vụ. Đơn hàng từ 150.000đ được miễn phí giao hàng.",
  },
  {
    id: 2,
    question: "Làm thế nào để đăng ký làm hội viên?",
    answer:
      "Bạn có thể đăng ký tại trang Hội viên MilktyWay hoặc nhập số điện thoại khi thanh toán. Sau khi đăng ký thành công, thông tin hội viên sẽ được lưu trong dữ liệu demo.",
  },
  {
    id: 3,
    question: "Cách quy đổi điểm thưởng như thế nào?",
    answer:
      "Mỗi điểm thưởng tương đương 1.000đ. Bạn có thể tích chọn Dùng điểm thưởng tại trang thanh toán. Số điểm sử dụng không vượt quá số dư và số tiền cần thanh toán.",
  },
  {
    id: 4,
    question: "Tôi có thể hủy đơn hàng sau khi đặt không?",
    answer:
      "Bạn có thể gửi yêu cầu hủy trong vòng 5 phút kể từ khi đặt hàng, khi đơn còn ở trạng thái chờ xác nhận hoặc đã xác nhận. Yêu cầu cần được cửa hàng xử lý trước khi đơn thực sự chuyển sang trạng thái Đã hủy.",
  },
  {
    id: 5,
    question: "MilktyWay hỗ trợ phương thức thanh toán nào?",
    answer:
      "MilktyWay hỗ trợ thanh toán khi nhận hàng (COD), Ví MoMo và chuyển khoản ngân hàng. Trong bản demo hiện tại, hai phương thức online chỉ mô phỏng giao dịch, chưa kết nối hệ thống thanh toán thật.",
  },
  {
    id: 6,
    question: "Làm sao để xem trạng thái đơn hàng?",
    answer:
      "Bạn vào mục Tra cứu đơn hàng, nhập mã đơn và số điện thoại đặt hàng. Sau khi xác thực OTP demo, hệ thống sẽ hiển thị trạng thái và tiến trình đơn hàng.",
  },
];

export default function FAQsPage() {
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <section className="feature-page faq-page">
      <div className="page-kicker">
        <span className="eyebrow">HELP CENTER</span>
        <h1>Câu hỏi thường gặp</h1>
        <p>
          Những thông tin hữu ích giúp bạn đặt hàng, thanh toán và sử dụng quyền
          lợi hội viên tại MilktyWay.
        </p>
      </div>

      <div className="faq-list">
        {faqItems.map((item) => {
          const isOpen = openId === item.id;

          return (
            <article
              className={`faq-item${isOpen ? " is-open" : ""}`}
              key={item.id}
            >
              <button
                type="button"
                className="faq-question"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${item.id}`}
                onClick={() => setOpenId(isOpen ? null : item.id)}
              >
                <span>{item.question}</span>

                <ChevronDown size={19} className="faq-chevron" />
              </button>

              <div
                id={`faq-answer-${item.id}`}
                className={`faq-answer${isOpen ? " is-open" : ""}`}
                aria-hidden={!isOpen}
              >
                <div className="faq-answer-inner">
                  <p>{item.answer}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="feature-card faq-support">
        <h2>Bạn vẫn cần hỗ trợ?</h2>

        <p>
          Bạn có thể tra cứu đơn hàng hoặc gửi yêu cầu hỗ trợ cho MilktyWay.
        </p>

        <div className="faq-support-actions">
          <Link to="/track" className="btn btn-primary">
            Tra cứu đơn hàng
          </Link>

          <Link to="/complaints" className="btn btn-soft">
            Gửi khiếu nại
          </Link>
        </div>
      </div>
    </section>
  );
}
