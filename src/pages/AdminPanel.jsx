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

  useEffect(() => {
    loadData();
  }, []);

  /* ---------------- Q2 INVENTORY ADJUSTMENT ---------------- */

  const subtractSpecificInventoryQ2 = async () => {
    const quarterRef = doc(db, "quarters", "Q2");
    const snap = await getDoc(quarterRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const stores = data?.stores || {};

    const adjustments = {
      imagination: "pet",
      giggles: "animating-animals",
      tinkertown: "animating-animals",
      playmotion: "pet"
    };

    const updatedStores = { ...stores };

    Object.keys(adjustments).forEach((shop) => {
      const toyId = adjustments[shop];
      const currentAmount =
        Number(stores?.[shop]?.orders?.[toyId]) || 0;

      const newAmount = Math.max(currentAmount - 100, 0);

      updatedStores[shop] = {
        ...updatedStores[shop],
        orders: {
          ...stores?.[shop]?.orders,
          [toyId]: newAmount
        }
      };
    });

    await updateDoc(quarterRef, {
      stores: updatedStores
    });

    alert("Q2 inventory reduced successfully.");
    loadData();
  };

  /* ---------------- RESET ---------------- */

  const resetSimulation = async () => {
    if (!window.confirm("Reset entire simulation?")) return;

    await updateDoc(doc(db, "gameState", "main"), {
      currentQuarter: 1,
      viewingQuarter: 1,
      Q1StrategyOpen: true,
      Q1PurchaseOpen: false,
      Q1ResultsReleased: false,
      Q2StrategyOpen: false,
      Q2PurchaseOpen: false,
      Q2ResultsReleased: false,
      Q3StrategyOpen: false,
      Q3PurchaseOpen: false,
      Q3ResultsReleased: false,
      Q4StrategyOpen: false,
      Q4PurchaseOpen: false,
      Q4ResultsReleased: false
    });

    for (let q = 1; q <= 4; q++) {
      await updateDoc(doc(db, "quarters", `Q${q}`), {
        stores: {},
        calculated: false
      });
    }

    alert("Simulation reset.");
    loadData();
  };

  /* ---------------- STAGE CONTROLS ---------------- */

  const openStrategy = async (q) => {
    await updateDoc(doc(db, "gameState", "main"), {
      [`Q${q}StrategyOpen`]: true,
      [`Q${q}PurchaseOpen`]: false,
      [`Q${q}ResultsReleased`]: false
    });
    loadData();
  };

  const openPurchase = async (q) => {
    await updateDoc(doc(db, "gameState", "main"), {
      [`Q${q}StrategyOpen`]: false,
      [`Q${q}PurchaseOpen`]: true
    });
    loadData();
  };

  const releaseResults = async (q) => {
    await updateDoc(doc(db, "gameState", "main"), {
      [`Q${q}ResultsReleased`]: true,
      currentQuarter: q < 4 ? q + 1 : 4,
      viewingQuarter: q
    });
    loadData();
  };

  /* ---------------- MARKET CALC ---------------- */

  const recalculateMarket = async (q) => {
    const snap = await getDoc(doc(db, "quarters", `Q${q}`));
    if (!snap.exists()) return;

    const data = snap.data();
    const stores = data?.stores || {};

    const teams = ALL_SHOPS.map((id) => {
      const store = stores[id] || {};
      return {
        id,
        orders: store.orders || {},
        buildingMultiplier: store.buildingMultiplier || 1,
        laborMultiplier: store.laborMultiplier || 1
      };
    });

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

        {/* 🔴 Q2 Adjustment Button */}
        <button
          onClick={subtractSpecificInventoryQ2}
          style={{ marginLeft: 10 }}
        >
          Subtract 100 (Q2 Only)
        </button>

        {Object.entries(QUARTERS).map(([quarter, toys]) => {
          const data = quarterData[quarter] || {};
          const stores = data?.stores || {};

          return (
            <div key={quarter} style={styles.card}>
              <h2>Quarter {quarter}</h2>

              <div style={{ marginBottom: 10 }}>
                <button onClick={() => openStrategy(Number(quarter))}>
                  🟢 Open Strategy
                </button>
                <button
                  onClick={() => openPurchase(Number(quarter))}
                  style={{ marginLeft: 10 }}
                >
                  🟡 Open Purchase
                </button>
                <button
                  onClick={() => releaseResults(Number(quarter))}
                  style={{ marginLeft: 10 }}
                >
                  🔵 Release Results
                </button>
                <button
                  onClick={() => recalculateMarket(Number(quarter))}
                  style={{ marginLeft: 10 }}
                >
                  Recalculate Market
                </button>
              </div>

              {/* Financial Summary + Toy Table unchanged */}

              {/* Financial Summary */}
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.cell}>Shop</th>
                    <th style={styles.cell}>Rent</th>
                    <th style={styles.cell}>Labor</th>
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

                    const rentCost = s.rentCost || 0;
                    const rentLabel = s.rentLabel || "";
                    const laborCost = s.laborCost || 0;
                    const laborLabel = s.laborLabel || "";
                    const insurance = s.insuranceCost || 0;
                    const insuranceLabel = s.insuranceLabel || "";

                    const base = s.baseRevenue || 0;
                    const building = s.buildingRevenue || 0;
                    const final = s.finalRevenue || 0;
                    const expenses = s.expenses || 0;

                    return (
                      <tr key={shop}>
                        <td style={styles.cell}>{shop}</td>
                        <td style={styles.cell}>
                          {rentLabel}
                          <br />
                          {formatMoney(rentCost)}
                        </td>
                        <td style={styles.cell}>
                          {laborLabel}
                          <br />
                          {formatMoney(laborCost)}
                        </td>
                        <td style={styles.cell}>
                          {insuranceLabel}
                          <br />
                          {formatMoney(insurance)}
                        </td>
                        <td style={styles.cell}>{formatMoney(base)}</td>
                        <td style={styles.cell}>{formatMoney(building)}</td>
                        <td style={styles.cell}>{formatMoney(final)}</td>
                        <td style={styles.cell}>{formatMoney(expenses)}</td>
                        <td style={styles.cell}>
                          {formatMoney(final - expenses)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Toy Breakdown */}
              <h3 style={{ marginTop: "30px" }}>
                Number of Toys Sold
              </h3>

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
                        const sold = stores?.[shop]?.sold?.[toy.id] || 0;
                        const ordered = stores?.[shop]?.orders?.[toy.id] || 0;

                        return (
                          <td key={shop} style={styles.cell}>
                            {sold} ({ordered})
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