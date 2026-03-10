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

import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

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

  const [viewingQuarter, setViewingQuarter] = useState(1);
  const [quarterData, setQuarterData] = useState({});
  const [gameState, setGameState] = useState(null);

  /* 🔐 Session Guard */
  useEffect(() => {
    const auth = sessionStorage.getItem("authenticatedShop");
    if (auth !== shopId) {
      navigate(`/login/${shopId}`);
    }
  }, [shopId, navigate]);

  /* 🔄 Load Data */
  useEffect(() => {
    const loadData = async () => {
      const gameSnap = await getDoc(doc(db, "gameState", "main"));
      if (!gameSnap.exists()) return;

      const data = gameSnap.data();
      setGameState(data);

      const releasedQuarters = [1, 2, 3, 4].filter(
        (q) => data[`Q${q}ResultsReleased`]
      );

      const latestReleased =
        releasedQuarters.length > 0
          ? Math.max(...releasedQuarters)
          : 1;

      setViewingQuarter(latestReleased);

      let allData = {};
      for (let q = 1; q <= 4; q++) {
        const snap = await getDoc(doc(db, "quarters", `Q${q}`));
        if (snap.exists()) {
          allData[q] = snap.data();
        }
      }

      setQuarterData(allData);
    };

    loadData();
  }, []);

  if (!gameState) return null;

  const releasedQuarters = [1, 2, 3, 4].filter(
    (q) => gameState?.[`Q${q}ResultsReleased`]
  );

  if (!releasedQuarters.includes(viewingQuarter)) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.container}>
          <h1 style={styles.title}>Results Not Released Yet</h1>
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

  const stores = quarterData?.[viewingQuarter]?.stores || {};
  const store = stores?.[shopId] || {};

  const base = safeNumber(store.baseRevenue);
  const building = safeNumber(store.buildingRevenue);
  const final = safeNumber(store.finalRevenue);
  const expenses = safeNumber(store.expenses);
  const profit = final - expenses;

  const orders = store.orders || {};
  const sold = store.sold || {};

  const graphData = releasedQuarters.map((q) => {
    const s = quarterData?.[q]?.stores?.[shopId] || {};
    const revenue = safeNumber(s.finalRevenue);
    const exp = safeNumber(s.expenses);

    return {
      quarter: quarterMap[q],
      Revenue: Math.round(revenue * 100) / 100,
      Profit: Math.round((revenue - exp) * 100) / 100
    };
  });

  const switchQuarter = async (q) => {
    await updateDoc(doc(db, "gameState", "main"), {
      viewingQuarter: q
    });
    setViewingQuarter(q);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h1 style={styles.title}>
          {quarterMap[viewingQuarter]} Results
        </h1>

        {/* Quarter Switch */}
        <div style={styles.switchRow}>
          {releasedQuarters.map((q) => (
            <button
              key={q}
              style={{
                ...styles.switchButton,
                ...(q === viewingQuarter ? styles.activeSwitch : {})
              }}
              onClick={() => switchQuarter(q)}
            >
              {quarterMap[q]}
            </button>
          ))}
        </div>

        {/* Financial Breakdown */}
        <div style={styles.card}>
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

        {/* Toy Breakdown */}
{/* Toy Breakdown */}
<div style={styles.card}>
  <h2>Toy Sales Breakdown</h2>

  {Object.keys(orders).length === 0 ? (
    <p>No toy data recorded for this quarter.</p>
  ) : (
    Object.keys(orders).map((toyId) => {
      const bought = safeNumber(orders[toyId]);
      const soldAmount = safeNumber(sold[toyId]);
      const leftover = bought - soldAmount;

      // Find toy info from quarter data
      const toyList = {
        1: require("../data/toys").Q1_TOYS,
        2: require("../data/q2Toys").Q2_TOYS,
        3: require("../data/q3Toys").Q3_TOYS,
        4: require("../data/q4Toys").Q4_TOYS
      };

      const toyInfo =
        toyList[viewingQuarter].find(t => t.id === toyId) || {};

      const toyName = toyInfo.name || toyId;
      const price = safeNumber(toyInfo.price);

      const revenue = soldAmount * price;
      const cost = leftover * price;

      return (
        <div key={toyId} style={{ marginBottom: "15px" }}>
          <div style={styles.row}>
            <span>
              {toyName} — Bought: {bought} (${price}) | Sold: {soldAmount} (${revenue})
            </span>
            <strong>
              {leftover === 0
                ? `Profit: ${formatMoney(revenue)}`
                : `Cost: ${formatMoney(cost)}`}
            </strong>
          </div>

          <div style={{ textAlign: "left", fontSize: "16px" }}>
            Leftover: {leftover}
          </div>
        </div>
      );
    })
  )}
</div>

        {/* Graph */}
        <div style={styles.card}>
          <h2>Revenue & Profit Over Time</h2>

          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={graphData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quarter" />
              <YAxis
                tickFormatter={(v) =>
                  `$${v.toLocaleString()}`
                }
              />
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