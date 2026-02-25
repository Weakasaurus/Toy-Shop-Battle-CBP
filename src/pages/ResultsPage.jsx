import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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

const quarterMap = {
  1: "Quarter One ❄️",
  2: "Quarter Two 🌷",
  3: "Quarter Three ☀️",
  4: "Quarter Four 🎁"
};

const formatMoney = (value) =>
  `$${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const safeNumber = (v) => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

export default function ResultsPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();

  const [viewingQuarter, setViewingQuarter] = useState(
    Number(localStorage.getItem("viewingQuarter")) ||
    Number(localStorage.getItem("currentQuarter")) ||
    1
  );

  /* 🔐 Session Guard */
  useEffect(() => {
    const auth = sessionStorage.getItem("authenticatedShop");
    if (auth !== shopId) {
      navigate(`/login/${shopId}`);
    }
  }, [shopId, navigate]);

  /* 🔓 Determine Released Quarters */
  const releasedQuarters = [1, 2, 3, 4].filter(q =>
    localStorage.getItem(`Q${q}-released`) === "true"
  );

  /* 🚫 If requested quarter not released */
  if (!releasedQuarters.includes(viewingQuarter)) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.container}>
          <h1 style={styles.title}>
            Results Not Released Yet
          </h1>
          <button
            style={styles.button}
            onClick={() => navigate(`/hub/${shopId}`)}
          >
            Back to Hub
          </button>
        </div>
      </div>
    );
  }

  /* 📊 Get Financial Data */
  const base = safeNumber(
    localStorage.getItem(`${shopId}-Q${viewingQuarter}-baseRevenue`)
  );

  const building = safeNumber(
    localStorage.getItem(`${shopId}-Q${viewingQuarter}-buildingRevenue`)
  );

  const final = safeNumber(
    localStorage.getItem(`${shopId}-Q${viewingQuarter}-finalRevenue`)
  );

  const expenses = safeNumber(
    localStorage.getItem(`${shopId}-Q${viewingQuarter}-expenses`)
  );

  const profit = final - expenses;

  /* 📈 Graph Data: Show up to highest released quarter */
  const graphData = releasedQuarters.map(q => {
    const revenue = safeNumber(
      localStorage.getItem(`${shopId}-Q${q}-finalRevenue`)
    );

    const expenses = safeNumber(
      localStorage.getItem(`${shopId}-Q${q}-expenses`)
    );

    return {
      quarter: quarterMap[q],
      Revenue: Math.round(revenue * 100) / 100,
      Profit: Math.round((revenue - expenses) * 100) / 100
    };
  });

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>

        <h1 style={styles.title}>
          {quarterMap[viewingQuarter]} Results
        </h1>

        {/* Quarter Switch Buttons */}
        <div style={styles.switchRow}>
  {releasedQuarters.map(q => (
    <button
      key={q}
      style={{
        ...styles.switchButton,
        ...(q === viewingQuarter
          ? styles.activeSwitch
          : {})
      }}
      onClick={() => {
        localStorage.setItem("viewingQuarter", q);
        setViewingQuarter(q);
      }}
    >
      {quarterMap[q]}
    </button>
  ))}
</div>

        {/* Financial Breakdown */}
        <div style={styles.card}>
          <div style={styles.row}>
            <span>Base Revenue</span>
            <strong>{formatMoney(base)}</strong>
          </div>

          <div style={styles.row}>
            <span>Building Revenue</span>
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
              fontWeight: "bold",
              color: profit < 0 ? "red" : "green"
            }}
          >
            <span>Profit</span>
            <strong>{formatMoney(profit)}</strong>
          </div>
        </div>

        {/* Graph */}
        <div style={styles.card}>
          <h2>Revenue & Profit Over Time</h2>

          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={graphData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quarter" />
              <YAxis tickFormatter={(v) => `$${v.toLocaleString()}`} />
              <Tooltip formatter={(v) => formatMoney(v)} />
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
          onClick={() => navigate(`/hub/${shopId}`)}
        >
          Back to Hub
        </button>

      </div>
    </div>
  );
}

const styles = {
  wrapper: {
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
    marginBottom: "30px"
  },
  card: {
    background: "white",
    padding: "30px",
    borderRadius: "25px",
    marginBottom: "30px"
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
    fontSize: "20px"
  },
  switchRow: {
    marginBottom: "25px",
    display: "flex",
    justifyContent: "center",
    gap: "10px"
  },
  switchButton: {
    padding: "10px 20px",
    borderRadius: "20px",
    fontFamily: "Funkids",
        fontSize: "28px"

  },
  activeSwitch: {
    backgroundColor: "#ffcc66"
  },
  button: {
    padding: "16px 40px",
    fontFamily: "Funkids",
    borderRadius: "20px",
    fontSize: "22px"
  }
};