// client/src/pages/Analysis.jsx
import { useEffect, useState } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function Analysis() {
  const [wardData, setWardData] = useState([]);
  const [directionData, setDirectionData] = useState([]);
  const [streetData, setStreetData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('text'); // 'text' | 'chart'

  useEffect(() => {
    const load = async () => {
      try {
        const wardRes = await fetch('/api/analysis/wards');
        const wardJson = await wardRes.json();
        setWardData(wardJson.wards || []);

        const dirRes = await fetch('/api/analysis/directions');
        const dirJson = await dirRes.json();
        setDirectionData(dirJson.directions || []);

        const streetRes = await fetch('/api/analysis/street-width');
        const streetJson = await streetRes.json();
        setStreetData(streetJson.widths || []);
      } catch (err) {
        console.error('Error loading analysis:', err);
      }
      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="text-center text-xl mt-8">
        Loading analysis...
      </div>
    );
  }

  // ========== helper màu ==========
  const baseColors = [
    '#2563EB',
    '#F97316',
    '#10B981',
    '#EC4899',
    '#8B5CF6',
    '#EAB308',
    '#06B6D4',
    '#F43F5E',
    '#22C55E',
    '#A855F7',
    '#0EA5E9',
    '#FBBF24',
  ];

  const makeColors = (n) => {
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push(baseColors[i % baseColors.length]);
    }
    return arr;
  };

  // ================== DATA CHO BIỂU ĐỒ ==================

  // GÓI 1 — Giá TB/m2 theo phường
  const wardChart = {
    labels: wardData.map((x) => x.ward),
    datasets: [
      {
        label: 'Giá trung bình/m²',
        data: wardData.map((x) =>
          x.avgPricePerM2 ? Math.round(x.avgPricePerM2) : 0
        ),
        backgroundColor: makeColors(wardData.length),
      },
    ],
  };

  // GÓI 3 — Giá TB/m2 theo hướng nhà
  const directionChart = {
    labels: directionData.map((x) => x.direction),
    datasets: [
      {
        label: 'Giá trung bình/m²',
        data: directionData.map((x) =>
          x.avgPricePerM2 ? Math.round(x.avgPricePerM2) : 0
        ),
        backgroundColor: makeColors(directionData.length),
      },
    ],
  };

  // GÓI 4 — Giá TB/m2 theo độ rộng đường
  const streetChart = {
    labels: streetData.map((x) => x.bucket),
    datasets: [
      {
        label: 'Giá trung bình/m²',
        data: streetData.map((x) =>
          x.avgPricePerM2 ? Math.round(x.avgPricePerM2) : 0
        ),
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.15)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const formatNumber = (n) =>
    typeof n === 'number' ? n.toLocaleString('vi-VN') : '-';

  const formatPrice = (n) =>
    typeof n === 'number' ? n.toLocaleString('vi-VN') + ' ₫' : '-';

  return (
    <div className="max-w-6xl mx-auto p-5">
      <h1 className="text-3xl font-bold text-slate-700 mb-4">
        🧠 Phân tích dữ liệu BĐS Đà Nẵng
      </h1>

      {/* 2 nút chuyển chế độ */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => setViewMode('text')}
          className={`px-4 py-2 rounded-full text-sm font-semibold border ${
            viewMode === 'text'
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          Chỉ số liệu (chữ + số)
        </button>

        <button
          onClick={() => setViewMode('chart')}
          className={`px-4 py-2 rounded-full text-sm font-semibold border ${
            viewMode === 'chart'
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          Biểu đồ trực quan
        </button>
      </div>

      {/* =============== CHẾ ĐỘ 1: TEXT / BẢNG =============== */}
      {viewMode === 'text' && (
        <div className="space-y-10">
          {/* GÓI 1: Phường */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-700 mb-2">
              📌 Gói 1: Phân tích theo Phường
            </h2>
            <p className="text-slate-600 mb-3 text-sm">
              Bảng xếp hạng phường theo giá trung bình/m² (cao → thấp). Cột % là
              tỷ lệ số tin của phường đó so với tổng số tin.
            </p>

            <div className="overflow-x-auto bg-white rounded-lg shadow-md">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-left">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Phường</th>
                    <th className="px-3 py-2">Số tin</th>
                    <th className="px-3 py-2">% tổng tin</th>
                    <th className="px-3 py-2">Tổng DT (m²)</th>
                    <th className="px-3 py-2">Tổng giá</th>
                    <th className="px-3 py-2">Giá TB/m²</th>
                  </tr>
                </thead>
                <tbody>
                  {wardData.map((w, idx) => (
                    <tr
                      key={w.ward}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                    >
                      <td className="px-3 py-2">{idx + 1}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{w.ward}</td>
                      <td className="px-3 py-2">{w.count}</td>
                      <td className="px-3 py-2">{w.percentage}%</td>
                      <td className="px-3 py-2">
                        {formatNumber(w.totalArea)}
                      </td>
                      <td className="px-3 py-2">
                        {formatPrice(w.totalPrice)}
                      </td>
                      <td className="px-3 py-2">
                        {w.avgPricePerM2
                          ? formatNumber(w.avgPricePerM2) + ' ₫/m²'
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* GÓI 3: Hướng nhà */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-700 mb-2">
              🧭 Gói 3: Phân tích theo hướng nhà
            </h2>
            <p className="text-slate-600 mb-3 text-sm">
              Thống kê số lượng tin, diện tích & giá trung bình theo từng hướng.
            </p>

            <div className="overflow-x-auto bg-white rounded-lg shadow-md">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-left">
                  <tr>
                    <th className="px-3 py-2">Hướng</th>
                    <th className="px-3 py-2">Số tin</th>
                    <th className="px-3 py-2">% tổng tin</th>
                    <th className="px-3 py-2">Tổng DT (m²)</th>
                    <th className="px-3 py-2">Tổng giá</th>
                    <th className="px-3 py-2">Giá TB/m²</th>
                  </tr>
                </thead>
                <tbody>
                  {directionData.map((d) => (
                    <tr key={d.direction}>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {d.direction}
                      </td>
                      <td className="px-3 py-2">{d.count}</td>
                      <td className="px-3 py-2">{d.percentage}%</td>
                      <td className="px-3 py-2">
                        {formatNumber(d.totalArea)}
                      </td>
                      <td className="px-3 py-2">
                        {formatPrice(d.totalPrice)}
                      </td>
                      <td className="px-3 py-2">
                        {d.avgPricePerM2
                          ? formatNumber(d.avgPricePerM2) + ' ₫/m²'
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* GÓI 4: Độ rộng đường */}
          <section className="pb-10">
            <h2 className="text-2xl font-semibold text-slate-700 mb-2">
              🛣️ Gói 4: Phân tích theo độ rộng đường (street_width)
            </h2>
            <p className="text-slate-600 mb-3 text-sm">
              Gộp thành các khoảng: Dưới 4m, 4–6m, 6–8m, 8–10m, Trên 10m.
            </p>

            <div className="overflow-x-auto bg-white rounded-lg shadow-md">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-left">
                  <tr>
                    <th className="px-3 py-2">Khoảng đường</th>
                    <th className="px-3 py-2">Số tin</th>
                    <th className="px-3 py-2">% tổng tin</th>
                    <th className="px-3 py-2">Tổng DT (m²)</th>
                    <th className="px-3 py-2">Tổng giá</th>
                    <th className="px-3 py-2">Giá TB/m²</th>
                  </tr>
                </thead>
                <tbody>
                  {streetData.map((w) => (
                    <tr key={w.bucket}>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {w.bucket}
                      </td>
                      <td className="px-3 py-2">{w.count}</td>
                      <td className="px-3 py-2">{w.percentage}%</td>
                      <td className="px-3 py-2">
                        {formatNumber(w.totalArea)}
                      </td>
                      <td className="px-3 py-2">
                        {formatPrice(w.totalPrice)}
                      </td>
                      <td className="px-3 py-2">
                        {w.avgPricePerM2
                          ? formatNumber(w.avgPricePerM2) + ' ₫/m²'
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* =============== CHẾ ĐỘ 2: CHART =============== */}
      {viewMode === 'chart' && (
        <div className="space-y-12 mb-16">
          {/* Gói 1 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-700 mb-3">
              📊 Gói 1: Giá đất trung bình theo Phường
            </h2>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <Bar data={wardChart} />
            </div>
          </section>

          {/* Gói 3 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-700 mb-3">
              🧭 Gói 3: Giá đất trung bình theo hướng nhà
            </h2>
            <div className="bg-white p-4 rounded-lg shadow-md w-full md:w-[500px]">
              <Pie data={directionChart} />
            </div>
          </section>

          {/* Gói 4 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-700 mb-3">
              🛣️ Gói 4: Giá đất trung bình theo độ rộng đường
            </h2>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <Line data={streetChart} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
