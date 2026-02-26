import { useState, useEffect } from "react";
import { Q1_TOYS } from "../data/toys";
import { Q2_TOYS } from "../data/q2Toys";
import { Q3_TOYS } from "../data/q3Toys";
import { Q4_TOYS } from "../data/q4Toys";
import { calculateMarket } from "../engine/marketEngine";

import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const ALL_SHOPS = [
  "imagination",
  "toytopia",
  "giggles",
  "tinkertown",
  "playmotion",
  "cranium"
];

const QUARTERS = {
  1: Q1_TOYS,
  2: Q2_TOYS,
  3: Q3_TOYS,
  4: Q4_TOYS
};

const formatMoney = (value) =>
  `$${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

export default function AdminPanel() {
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [quarterData, setQuarterData] = useState({});
  const [gameState, setGameState] = useState({});

  useEffect(() => {
    const saved = sessionStorage.getItem("adminAuthorized");
    if (saved === "true") setAuthorized(true);
  }, []);

  const handleLogin = () => {
    if (password === "chloe1226") {
      setAuthorized(true);
      sessionStorage.setItem("adminAuthorized", "true");
    } else {
      alert("Incorrect password");
    }
  };

  const loadData = async () => {
    const gameSnap = await getDoc(doc(db, "gameState", "main"));
    if (gameSnap.exists()) setGameState(gameSnap.data());

    for (let q = 1; q <= 4; q++) {
      const snap = await getDoc(doc(db, "quarters", `Q${q}`));
      if (snap.exists()) {
        setQuarterData((prev) => ({
          ...prev,
          [q]: snap.data()
        }));
      }
    }
  };
const resetSimulation = async () => {
  const confirmReset = window.confirm(
    "Are you sure you want to reset the entire simulation?"
  );
  if (!confirmReset) return;

  // Reset game state
  await updateDoc(doc(db, "gameState", "main"), {
    currentQuarter: 1,
    viewingQuarter: 1,
    Q1Released: false,
    Q2Released: false,
    Q3Released: false,
    Q4Released: false
  });

  // Clear quarters data
  for (let q = 1; q <= 4; q++) {
    await updateDoc(doc(db, "quarters", `Q${q}`), {
      stores: {},
      calculated: false
    });
  }

  alert("Simulation reset.");
  loadData();
};
  useEffect(() => {
    loadData();
  }, []);

  const releaseQuarter = async (q) => {
    await updateDoc(doc(db, "gameState", "main"), {
      [`Q${q}Released`]: true,
      currentQuarter: q < 4 ? q + 1 : 4,
      viewingQuarter: q < 4 ? q + 1 : 4
    });

    alert(`Quarter ${q} released.`);
    loadData();
  };

  const recalculateMarket = async (q) => {
    const snap = await getDoc(doc(db, "quarters", `Q${q}`));
    if (!snap.exists()) return;

    const data = snap.data();
    const stores = data?.stores || {};

    const teams = ALL_SHOPS.map((id) => ({
      id,
      orders: stores[id]?.orders || {}
    }));

    const results = calculateMarket(teams, q);

    const updatedStores = { ...stores };

    ALL_SHOPS.forEach((id) => {
      updatedStores[id] = {
        ...updatedStores[id],
        baseRevenue: results[id].baseRevenue,
        buildingRevenue: results[id].buildingRevenue,
        finalRevenue: results[id].finalRevenue,
        sold: results[id].sold
      };
    });

    await updateDoc(doc(db, "quarters", `Q${q}`), {
      stores: updatedStores,
      calculated: true
    });

    loadData();
  };

  if (!authorized) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.container}>
          <h1>Admin Login</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin}>Enter</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h1 style={styles.title}>Admin Dashboard</h1>
<button onClick={resetSimulation}>
  🔄 Reset Simulation
</button>
        {Object.entries(QUARTERS).map(([quarter, toys]) => {
          const data = quarterData[quarter] || {};
          const stores = data?.stores || {};

          return (
            <div key={quarter} style={styles.card}>
              <h2>Quarter {quarter}</h2>

              <button onClick={() => releaseQuarter(Number(quarter))}>
                Release Quarter
              </button>

              <button
                onClick={() => recalculateMarket(Number(quarter))}
                style={{ marginLeft: 10 }}
              >
                Recalculate Market
              </button>

              {/* Financial Summary */}
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.cell}>Shop</th>
<th style={styles.cell}>Insurance</th>
<th style={styles.cell}>Base Revenue</th>
<th style={styles.cell}>Building Revenue</th>
<th style={styles.cell}>Final Revenue</th>
<th style={styles.cell}>Total Expenses</th>
<th style={styles.cell}>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {ALL_SHOPS.map((shop) => {
                    const s = stores[shop] || {};
                    const insurance = s.insuranceCost || 0;
                    const base = s.baseRevenue || 0;
                    const building = s.buildingRevenue || 0;
                    const final = s.finalRevenue || 0;
                    const expenses = s.expenses || 0;

                    return (
                      <tr key={shop}>
                        <tr key={shop}>
  <td style={styles.cell}>{shop}</td>
  <td style={styles.cell}>{formatMoney(insurance)}</td>
  <td style={styles.cell}>{formatMoney(base)}</td>
  <td style={styles.cell}>{formatMoney(building)}</td>
  <td style={styles.cell}>{formatMoney(final)}</td>
  <td style={styles.cell}>{formatMoney(expenses)}</td>
  <td style={styles.cell}>{formatMoney(final - expenses)}</td>
</tr>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Toy Breakdown */}
              <h3 style={{ marginTop: "30px" }}>Number of Toys Sold</h3>

              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.cell}>Base Demand</th>
                    <th style={styles.cell}>Total Supply</th>
                    <th style={styles.cell}>Toy</th>
                    {ALL_SHOPS.map((shop) => (
                      <th key={shop} style={styles.cell}>{shop}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {toys.map((toy) => (
                    <tr key={toy.id}>
                      <td style={styles.cell}>{toy.baseDemand}</td>
                      <td style={styles.cell}>
                        {ALL_SHOPS.reduce(
                          (sum, shop) =>
                            sum + (stores?.[shop]?.orders?.[toy.id] || 0),
                          0
                        )}
                      </td>
                                            <td style={styles.cell}>{toy.name}</td>

                      {ALL_SHOPS.map((shop) => {
  const sold =
    stores?.[shop]?.sold?.[toy.id] || 0;

  const ordered =
    stores?.[shop]?.orders?.[toy.id] || 0;

  return (
    <td key={shop} style={styles.cell}>
      {sold}{" "}
      <span style={{ color: "#777", fontSize: "14px" }}>
        ({ordered})
      </span>
    </td>
  );
})}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
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
    maxWidth: "1300px",
    margin: "0 auto",
    padding: "40px"
  },
  title: {
    fontSize: "50px",
    marginBottom: "20px"
  },
  card: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "15px",
    marginBottom: "40px",
    overflowX: "auto"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "15px"
  },
  cell: {
    border: "1px solid black",
    padding: "6px",
    textAlign: "center"
  }
};