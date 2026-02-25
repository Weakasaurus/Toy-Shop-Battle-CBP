import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
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

export default function ResultsPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();

  const currentQuarter =
    Number(localStorage.getItem("currentQuarter")) || 1;

  // 🔐 SESSION AUTH GUARD
  useEffect(() => {
    const authenticated = sessionStorage.getItem("authenticatedShop");
    if (authenticated !== shopId) {
      navigate(`/login/${shopId}`);
    }
  }, [shopId, navigate]);

  const isReleased =
    localStorage.getItem(`Q${currentQuarter}-released`) === "true";

  if (!isReleased) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.container}>
          <h1 style={styles.title}>
            Results Not Released Yet
          </h1>
          <button style={styles.button} onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const base = safeNumber(
    localStorage.getItem(`${shopId}-Q${currentQuarter}-baseRevenue`)
  );

  const building = safeNumber(
    localStorage.getItem(`${shopId}-Q${currentQuarter}-buildingRevenue`)
  );

  const final = safeNumber(
    localStorage.getItem(`${shopId}-Q${currentQuarter}-finalRevenue`)
  );

  const expenses = safeNumber(
    localStorage.getItem(`${shopId}-Q${currentQuarter}-expenses`)
  );

  const profit = roundMoney(final - expenses);

  const allData = [1, 2, 3, 4].map((q) => {
    const revenueRaw = safeNumber(
      localStorage.getItem(`${shopId}-Q${q}-finalRevenue`)
    );
    const expensesRaw = safeNumber(
      localStorage.getItem(`${shopId}-Q${q}-expenses`)
    );

    return {
      quarter: quarterMap[q],
      Revenue: roundMoney(revenueRaw),
      Profit: roundMoney(revenueRaw - expensesRaw)
    };
  });

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>

        <h1 style={styles.title}>
          {quarterMap[currentQuarter]} Results
        </h1>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Breakdown</h2>

          <div style={styles.row}>
            <span>Base Revenue</span>
            <strong>{formatMoney(base)}</strong>
          </div>

          <div style={styles.row}>
            <span>After Building</span>
            <strong>{formatMoney(building)}</strong>
          </div>

          <div style={styles.row}>
            <span>Final Revenue</span>
            <strong>{formatMoney(final)}</strong>
          </div>

          <div style={styles.row}>
            <span>Total Expenses</span>
            <strong>{formatMoney(expenses)}</strong>
          </div>

          <div
            style={{
              ...styles.row,
              fontSize: "26px",
              fontWeight: "bold",
              color: profit >= 0 ? "green" : "red"
            }}
          >
            <span>Profit</span>
            <strong>{formatMoney(profit)}</strong>
          </div>
        </div>

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
    background: "linear-gradient(180deg, #d385ec 0%, #a3e7f0 100%)"
  },
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "60px 20px",
    textAlign: "center"
  },
  title: {
    fontFamily: "Funkids",
    fontSize: "60px",
    marginBottom: "40px"
  },
  card: {
    backgroundColor: "white",
    padding: "35px",
    borderRadius: "30px",
    marginBottom: "35px"
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
    padding: "20px 50px",
    fontSize: "24px",
    borderRadius: "45px",
    border: "none",
    backgroundColor: "#ffcc66",
    fontFamily: "Funkids",
    cursor: "pointer"
  }
};