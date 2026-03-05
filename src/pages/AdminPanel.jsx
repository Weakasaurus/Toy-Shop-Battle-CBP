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

  const recalculateMarket = async (q) => {
    const snap = await getDoc(doc(db, "quarters", `Q${q}`));
    if (!snap.exists()) return;

    const data = snap.data();
    const stores = data?.stores || {};

    // 🔥 FIX: include multipliers from Firebase
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
      <div style={{ padding: 40 }}>
        <h1>Admin Login</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Enter</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Admin Dashboard</h1>

      {Object.entries(QUARTERS).map(([quarter, toys]) => {
        const data = quarterData[quarter] || {};
        const stores = data?.stores || {};

        return (
          <div key={quarter} style={{ marginBottom: 50 }}>
            <h2>Quarter {quarter}</h2>

            <button onClick={() => recalculateMarket(Number(quarter))}>
              Recalculate Market
            </button>

            {/* Financial Summary */}
            <table border="1" cellPadding="6" style={{ marginTop: 20 }}>
              <thead>
                <tr>
                  <th>Shop</th>
                  <th>Rent</th>
                  <th>Labor</th>
                  <th>Insurance</th>
                  <th>Base Revenue</th>
                  <th>Building Revenue</th>
                  <th>Final Revenue</th>
                  <th>Total Expenses</th>
                  <th>Profit</th>
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
                      <td>{shop}</td>

                      <td>
                        {rentLabel}
                        <br />
                        {formatMoney(rentCost)}
                      </td>

                      <td>
                        {laborLabel}
                        <br />
                        {formatMoney(laborCost)}
                      </td>

                      <td>
                        {insuranceLabel}
                        <br />
                        {formatMoney(insurance)}
                      </td>

                      <td>{formatMoney(base)}</td>
                      <td>{formatMoney(building)}</td>
                      <td>{formatMoney(final)}</td>
                      <td>{formatMoney(expenses)}</td>
                      <td>{formatMoney(final - expenses)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Toy Breakdown */}
            <h3 style={{ marginTop: 30 }}>
              Number of Toys Sold
            </h3>

            <table border="1" cellPadding="6">
              <thead>
                <tr>
                  <th>Base Demand</th>
                  <th>Total Supply</th>
                  <th>Toy</th>
                  {ALL_SHOPS.map((shop) => (
                    <th key={shop}>{shop}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {toys.map((toy) => (
                  <tr key={toy.id}>
                    <td>{toy.baseDemand}</td>
                    <td>
                      {ALL_SHOPS.reduce(
                        (sum, shop) =>
                          sum + (stores?.[shop]?.orders?.[toy.id] || 0),
                        0
                      )}
                    </td>
                    <td>{toy.name}</td>

                    {ALL_SHOPS.map((shop) => {
                      const sold = stores?.[shop]?.sold?.[toy.id] || 0;
                      const ordered =
                        stores?.[shop]?.orders?.[toy.id] || 0;

                      return (
                        <td key={shop}>
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