import { useState, useEffect } from "react";
import { Q1_TOYS } from "../data/toys";
import { Q2_TOYS } from "../data/q2Toys";
import { Q3_TOYS } from "../data/q3Toys";
import { Q4_TOYS } from "../data/q4Toys";
import { calculateMarket } from "../engine/marketEngine";

import { db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";

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

  useEffect(() => {
    const saved =
      sessionStorage.getItem("adminAuthorized");
    if (saved === "true") {
      setAuthorized(true);
    }
  }, []);

  const handleLogin = () => {
    if (password === "chloe1226") {
      setAuthorized(true);
      sessionStorage.setItem(
        "adminAuthorized",
        "true"
      );
    } else {
      alert("Incorrect password");
    }
  };

  const loadQuarter = async (q) => {
    const snap = await getDoc(
      doc(db, "quarters", `Q${q}`)
    );
    if (snap.exists()) {
      setQuarterData((prev) => ({
        ...prev,
        [q]: snap.data()
      }));
    }
  };

  useEffect(() => {
    [1, 2, 3, 4].forEach((q) =>
      loadQuarter(q)
    );
  }, []);

  const releaseQuarter = (q) => {
    localStorage.setItem(`Q${q}-released`, "true");
    localStorage.setItem(
      "currentQuarter",
      String(Number(q) + 1)
    );
    alert(`Quarter ${q} released.`);
    window.location.reload();
  };

  const recalculateMarket = async (q) => {
    const snap = await getDoc(
      doc(db, "quarters", `Q${q}`)
    );
    if (!snap.exists()) return;

    const data = snap.data();
    const stores = data?.stores || {};

    const teams = ALL_SHOPS.map((id) => ({
      id,
      orders: stores[id]?.orders || {}
    }));

    const results = calculateMarket(
      teams,
      q
    );

    const updatedStores = { ...stores };

    ALL_SHOPS.forEach((id) => {
      updatedStores[id] = {
        ...updatedStores[id],
        baseRevenue:
          results[id].baseRevenue,
        buildingRevenue:
          results[id].buildingRevenue,
        finalRevenue:
          results[id].finalRevenue,
        sold: results[id].sold
      };
    });

    await updateDoc(
      doc(db, "quarters", `Q${q}`),
      {
        stores: updatedStores,
        calculated: true
      }
    );

    alert(`Quarter ${q} recalculated.`);
    loadQuarter(q);
  };

  if (!authorized) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Admin Login</h1>
        <input
          type="password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />
        <button onClick={handleLogin}>
          Enter
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Admin Dashboard</h1>

      {Object.entries(QUARTERS).map(
        ([quarter, toys]) => {
          const data =
            quarterData[quarter] || {};
          const stores =
            data?.stores || {};

          return (
            <div
              key={quarter}
              style={{
                marginBottom: 60
              }}
            >
              <h2>Quarter {quarter}</h2>

              <button
                onClick={() =>
                  releaseQuarter(quarter)
                }
              >
                Release Quarter
              </button>

              <button
                onClick={() =>
                  recalculateMarket(quarter)
                }
                style={{ marginLeft: 10 }}
              >
                Recalculate Market
              </button>

              <table
                style={{
                  width: "100%",
                  marginTop: 20
                }}
              >
                <thead>
                  <tr>
                    <th>Shop</th>
                    <th>Final Revenue</th>
                    <th>Expenses</th>
                    <th>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {ALL_SHOPS.map(
                    (store) => {
                      const s =
                        stores[store] || {};
                      const final =
                        s.finalRevenue || 0;
                      const expenses =
                        s.expenses || 0;

                      return (
                        <tr key={store}>
                          <td>{store}</td>
                          <td>
                            {formatMoney(
                              final
                            )}
                          </td>
                          <td>
                            {formatMoney(
                              expenses
                            )}
                          </td>
                          <td>
                            {formatMoney(
                              final -
                                expenses
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          );
        }
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #d385ec 0%, #a3e7f0 100%)"
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