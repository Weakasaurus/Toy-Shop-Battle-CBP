import { useParams, useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts";

const safeNumber = (v) => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

const roundMoney = (value) =>
  Number((Math.round(value * 100) / 100).toFixed(2));

const formatMoney = (value) =>
  `$${roundMoney(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const quarterMap = {
  1: "Quarter One ❄️",
  2: "Quarter Two 🌷",
  3: "Quarter Three ☀️",
  4: "Quarter Four 🎁"
};

export default function FinalSummary() {
  const { shopId } = useParams();
  const navigate = useNavigate();

  const allData = [1, 2, 3, 4].map(q => {
    const revenueRaw = safeNumber(
      localStorage.getItem(`${shopId}-Q${q}-finalRevenue`)
    );

    const expensesRaw = safeNumber(
      localStorage.getItem(`${shopId}-Q${q}-expenses`)
    );

    const revenue = roundMoney(revenueRaw);
    const profit = roundMoney(revenueRaw - expensesRaw);

    return {
      quarter: quarterMap[q],
      Revenue: revenue,
      Profit: profit
    };
  });

  const totalRevenue = roundMoney(
    allData.reduce((sum, q) => sum + q.Revenue, 0)
  );

  const totalProfit = roundMoney(
    allData.reduce((sum, q) => sum + q.Profit, 0)
  );

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        <h1 style={styles.title}>
          🎉 Final Year Summary 🎉
        </h1>

        {/* Quarter Breakdown */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>
            Year Breakdown
          </h2>

          {allData.map((q, index) => (
            <div key={index} style={styles.row}>
              <span>{q.quarter}</span>
              <span>{formatMoney(q.Revenue)}</span>
              <span
                style={{
                  color: q.Profit >= 0 ? "green" : "red"
                }}
              >
                {formatMoney(q.Profit)}
              </span>
            </div>
          ))}
        </div>

        {/* Graph */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>
            Revenue & Profit Over Time 📈
          </h2>

          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={allData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quarter" />
              <YAxis
                tickFormatter={(value) =>
                  `$${value.toLocaleString()}`
                }
              />
              <Tooltip formatter={(value) => formatMoney(value)} />
              <Legend />

              <Line
                type="monotone"
                dataKey="Revenue"
                stroke="#ffcc66"
                strokeWidth={3}
                dot={{ r: 6 }}
              />

              <Line
                type="monotone"
                dataKey="Profit"
                stroke="green"
                strokeWidth={3}
                dot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Totals */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>
            Year Totals
          </h2>

          <div style={styles.row}>
            <span>Total Revenue</span>
            <strong>{formatMoney(totalRevenue)}</strong>
          </div>

          <div style={styles.row}>
            <span>Total Profit</span>
            <strong
              style={{
                color: totalProfit >= 0 ? "green" : "red"
              }}
            >
              {formatMoney(totalProfit)}
            </strong>
          </div>
        </div>

        <button
          style={styles.button}
          onClick={() => navigate("/")}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #fdf7ff 0%, #e0f7fa 100%)"
  },
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "60px 20px",
    textAlign: "center"
  },
  title: {
    fontFamily: "Funkids",
    fontSize: "70px",
    marginBottom: "40px"
  },
  card: {
    backgroundColor: "white",
    padding: "35px",
    borderRadius: "30px",
    marginBottom: "35px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)"
  },
  sectionTitle: {
    fontSize: "28px",
    marginBottom: "20px"
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "22px",
    marginBottom: "12px"
  },
  button: {
    padding: "18px 50px",
    fontSize: "22px",
    borderRadius: "40px",
    border: "none",
    backgroundColor: "#ffcc66",
    fontFamily: "Funkids",
    cursor: "pointer"
  }
};