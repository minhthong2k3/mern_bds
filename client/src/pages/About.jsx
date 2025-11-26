import React from 'react';

export default function About() {
  return (
    <div className="bg-slate-50/60">
      <div className="max-w-6xl mx-auto px-4 py-16 lg:py-20">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
            Về DaNang Estate
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Nền tảng hỗ trợ tìm kiếm, đăng và quản lý bất động sản tại Đà Nẵng –
            giúp bạn tìm được nơi ở phù hợp một cách nhanh chóng và dễ dàng.
          </p>
        </div>

        {/* Nội dung chính */}
        <div className="grid gap-10 md:grid-cols-2 items-start">
          {/* Cột 1: giới thiệu chung */}
          <div className="space-y-4 text-slate-700">
            <h2 className="text-xl font-semibold text-slate-800">
              Sứ mệnh của chúng tôi
            </h2>
            <p>
              DaNang Estate được xây dựng với mục tiêu trở thành nơi kết nối
              giữa người mua, người thuê và chủ nhà tại Đà Nẵng. Chúng tôi tập
              trung vào trải nghiệm đơn giản, rõ ràng, thông tin minh bạch để
              mọi người đều có thể dễ dàng tiếp cận thị trường bất động sản.
            </p>
            <p>
              Dù bạn đang cần tìm một căn hộ để ở, một ngôi nhà cho gia đình
              hay một mặt bằng kinh doanh, DaNang Estate luôn cố gắng mang lại
              những gợi ý phù hợp nhất, kèm theo công cụ lọc và tìm kiếm linh
              hoạt.
            </p>
            <p>
              Chúng tôi hiểu rằng bất động sản không chỉ là tài sản – đó còn là
              nơi bạn sống, làm việc và gắn bó. Vì vậy, mọi tính năng trên hệ
              thống đều được thiết kế để giúp bạn ra quyết định dễ dàng và
              tự tin hơn.
            </p>
          </div>

          {/* Cột 2: các điểm mạnh / tính năng */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-7 space-y-5">
            <h2 className="text-xl font-semibold text-slate-800">
              Điều bạn có thể làm trên DaNang Estate
            </h2>
            <ul className="space-y-3 text-slate-700 text-sm md:text-base">
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <span>
                  <strong>Tra cứu bất động sản</strong> theo khu vực, loại hình,
                  giá, tiện ích (chỗ đậu xe, nội thất, ưu đãi,…).
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <span>
                  <strong>Đăng tin cho thuê / mua bán</strong> nhanh chóng với
                  hình ảnh, mô tả chi tiết và quản lý tin trong trang cá nhân.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <span>
                  <strong>Theo dõi trạng thái duyệt tin</strong> (chờ duyệt, đã
                  duyệt, không duyệt kèm lý do) rõ ràng, minh bạch.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <span>
                  <strong>Kết hợp dữ liệu từ nhiều nguồn</strong> giúp bạn có cái
                  nhìn tổng quan hơn về mặt bằng giá và nguồn cung tại Đà Nẵng.
                </span>
              </li>
            </ul>

            <div className="pt-3 border-t border-slate-100 text-sm text-slate-600">
              <p>
                DaNang Estate vẫn đang được phát triển và hoàn thiện. Nếu bạn có
                góp ý hoặc ý tưởng tính năng mới, rất mong nhận được phản hồi từ
                bạn để nền tảng ngày càng hữu ích hơn.
              </p>
            </div>
          </div>
        </div>

        {/* Footer nhỏ */}
        <div className="mt-10 text-center text-xs text-slate-500">
          <p>DaNang Estate – Xây dựng không gian sống lý tưởng tại Đà Nẵng.</p>
        </div>
      </div>
    </div>
  );
}
