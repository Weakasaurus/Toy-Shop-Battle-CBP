import { useState, useEffect } from "react";
import { Q1_TOYS } from "../data/toys";
import { Q2_TOYS } from "../data/q2Toys";
import { Q3_TOYS } from "../data/q3Toys";
import { Q4_TOYS } from "../data/q4Toys";
import { calculateMarket } from "../engine/marketEngine";

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

  /* 🔐 Persist login per tab */
  useEffect(() => {
    const saved = sessionStorage.getItem("adminAuthorized");
    if (saved === "true") {
      setAuthorized(true);
    }
  }, []);

  const handleLogin = () => {
    if (password === "chloe1226") {
      setAuthorized(true);
      sessionStorage.setItem("adminAuthorized", "true");
    } else {
      alert("Incorrect password");
    }
  };

  const releaseQuarter = (q) => {
    localStorage.setItem(`Q${q}-released`, "true");

    const nextQuarter = Number(q) + 1;
    if (nextQuarter <= 4) {
      localStorage.setItem("currentQuarter", String(nextQuarter));
    }

    alert(`Quarter ${q} released.`);
    window.location.reload();
  };

  const resetSimulation = () => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("currentQuarter", "1");
    alert("Simulation reset.");
    window.location.reload();
  };

  /* 🧠 RE-CALCULATE MARKET FOR A QUARTER */
  const recalculateMarket = (quarter) => {
    const teams = ALL_SHOPS.map((id) => ({
      id,
      orders: JSON.parse(
        localStorage.getItem(`${id}-Q${quarter}-orders`) || "{}"
      )
    }));

    const results = calculateMarket(teams, quarter);

    ALL_SHOPS.forEach((id) => {
      const shopResults = results[id];

      localStorage.setItem(
        `${id}-Q${quarter}-baseRevenue`,
        shopResults.baseRevenue
      );

      localStorage.setItem(
        `${id}-Q${quarter}-buildingRevenue`,
        shopResults.buildingRevenue
      );

      localStorage.setItem(
        `${id}-Q${quarter}-finalRevenue`,
        shopResults.finalRevenue
      );

      localStorage.setItem(
        `${id}-Q${quarter}-sold`,
        JSON.stringify(shopResults.sold)
      );
    });

    localStorage.setItem(`Q${quarter}-calculated`, "true");

    alert(`Quarter ${quarter} recalculated.`);
    window.location.reload();
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

        {Object.entries(QUARTERS).map(([quarter, toys]) => (
          <div key={quarter} style={styles.card}>
            <h2>Quarter {quarter}</h2>

            <button onClick={() => releaseQuarter(quarter)}>
              Release Quarter
            </button>

            <button
              onClick={() => recalculateMarket(quarter)}
              style={{ marginLeft: 10 }}
            >
              🔁 Recalculate Market
            </button>

            {/* ================= FINANCIAL SUMMARY ================= */}
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.cell}>Shop</th>
                  <th style={styles.cell}>Base Revenue</th>
                  <th style={styles.cell}>Building Revenue</th>
                  <th style={styles.cell}>Final Revenue</th>
                  <th style={styles.cell}>Total Expenses</th>
                  <th style={styles.cell}>Profit</th>
                </tr>
              </thead>
              <tbody>
                {ALL_SHOPS.map((shop) => {
                  const submitted =
                    localStorage.getItem(
                      `${shop}-Q${quarter}-submitted`
                    ) === "true";

                  const base = submitted
                    ? Number(
                        localStorage.getItem(
                          `${shop}-Q${quarter}-baseRevenue`
                        )
                      ) || 0
                    : 0;

                  const building = submitted
                    ? Number(
                        localStorage.getItem(
                          `${shop}-Q${quarter}-buildingRevenue`
                        )
                      ) || 0
                    : 0;

                  const final = submitted
                    ? Number(
                        localStorage.getItem(
                          `${shop}-Q${quarter}-finalRevenue`
                        )
                      ) || 0
                    : 0;

                  const expenses = submitted
                    ? Number(
                        localStorage.getItem(
                          `${shop}-Q${quarter}-expenses`
                        )
                      ) || 0
                    : 0;

                  const profit = final - expenses;

                  return (
                    <tr key={shop}>
                      <td style={styles.cell}>{shop}</td>
                      <td style={styles.cell}>
                        {submitted ? formatMoney(base) : ""}
                      </td>
                      <td style={styles.cell}>
                        {submitted ? formatMoney(building) : ""}
                      </td>
                      <td style={styles.cell}>
                        {submitted ? formatMoney(final) : ""}
                      </td>
                      <td style={styles.cell}>
                        {submitted ? formatMoney(expenses) : ""}
                      </td>
                      <td
                        style={{
                          ...styles.cell,
                          color:
                            submitted && profit < 0
                              ? "red"
                              : "green"
                        }}
                      >
                        {submitted ? formatMoney(profit) : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* ================= TOY BREAKDOWN ================= */}
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
                    <th key={shop} style={styles.cell}>
                      {shop}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {toys.map((toy) => (
                  <tr key={toy.id}>
                    <td style={styles.cell}>
                      {toy.baseDemand}
                    </td>

                    <td style={styles.cell}>
                      {ALL_SHOPS.reduce(
                        (sum, shop) =>
                          sum +
                          (JSON.parse(
                            localStorage.getItem(
                              `${shop}-Q${quarter}-orders`
                            ) || "{}"
                          )[toy.id] || 0),
                        0
                      )}
                    </td>

                    <td style={styles.cell}>{toy.name}</td>

                    {ALL_SHOPS.map((shop) => {
                      const submitted =
                        localStorage.getItem(
                          `${shop}-Q${quarter}-submitted`
                        ) === "true";

                      const sold = submitted
                        ? JSON.parse(
                            localStorage.getItem(
                              `${shop}-Q${quarter}-sold`
                            ) || "{}"
                          )[toy.id] || 0
                        : "";

                      return (
                        <td key={shop} style={styles.cell}>
                          {sold}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
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