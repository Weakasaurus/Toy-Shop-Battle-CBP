import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Q1_TOYS } from "../data/toys";
import { Q2_TOYS } from "../data/q2Toys";
import { Q3_TOYS } from "../data/q3Toys";
import { Q4_TOYS } from "../data/q4Toys";
import { calculateMarket } from "../engine/marketEngine";

const ORDER_OPTIONS = [0, 100, 250, 500];

const ALL_SHOPS = [
  "imagination",
  "toytopia",
  "giggles",
  "tinkertown",
  "playmotion",
  "cranium"
];

const safeNumber = (v) => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

export default function PurchasePage() {
  const { shopId } = useParams();
  const navigate = useNavigate();

  const currentQuarter =
    localStorage.getItem("currentQuarter") || "1";

  const BUDGET =
    currentQuarter === "4" ? 15000 : 10000;

  const orderKey = `${shopId}-Q${currentQuarter}-orders`;

  /* 🔐 SESSION LOGIN */
  useEffect(() => {
    const auth = sessionStorage.getItem("authenticatedShop");
    if (auth !== shopId) {
      navigate(`/login/${shopId}`);
    }
  }, [shopId, navigate]);

  /* 🔒 LOCK IF SUBMITTED */
  useEffect(() => {
    const submitted =
      localStorage.getItem(
        `${shopId}-Q${currentQuarter}-submitted`
      ) === "true";

    const released =
      localStorage.getItem(
        `Q${currentQuarter}-released`
      ) === "true";

    if (submitted && !released) {
      navigate(`/waiting/${shopId}`, {
        replace: true
      });
    }
  }, [shopId, currentQuarter, navigate]);

  /* 🎲 SELECT TOYS */
  const TOYS =
    currentQuarter === "2"
      ? Q2_TOYS
      : currentQuarter === "3"
      ? Q3_TOYS
      : currentQuarter === "4"
      ? Q4_TOYS
      : Q1_TOYS;

  const [orders, setOrders] = useState({});
  const [predictedRevenue, setPredictedRevenue] = useState(0);

  const businessExpenses = safeNumber(
    localStorage.getItem(`${shopId}-businessExpenses`)
  );

  /* 📥 LOAD ORDERS */
  useEffect(() => {
    const saved = JSON.parse(
      localStorage.getItem(orderKey) || "{}"
    );
    setOrders(saved);
  }, [orderKey]);

  const handleOrderChange = (toyId, qty) => {
    const updated = { ...orders, [toyId]: qty };
    setOrders(updated);
    localStorage.setItem(orderKey, JSON.stringify(updated));
  };

  const toyExpenses = TOYS.reduce(
    (sum, toy) =>
      sum +
      safeNumber(orders[toy.id]) *
        safeNumber(toy.unitPrice),
    0
  );

  const isOverBudget = toyExpenses > BUDGET;

  /* 🔮 LIVE PREDICTION (NOT SAVED) */
  useEffect(() => {
    const teams = ALL_SHOPS.map((id) => ({
      id,
      orders:
        id === shopId
          ? orders
          : JSON.parse(
              localStorage.getItem(
                `${id}-Q${currentQuarter}-orders`
              ) || "{}"
            )
    }));

    const results = calculateMarket(teams, currentQuarter);

    const revenue =
      results?.[shopId]?.finalRevenue || 0;

    setPredictedRevenue(
      Math.round(revenue * 100) / 100
    );
  }, [orders, shopId, currentQuarter]);

  const handleSubmit = () => {
    if (isOverBudget) {
      alert("Reduce toy order. You are over budget.");
      return;
    }

    const totalExpenses =
      toyExpenses + businessExpenses;

    localStorage.setItem(
      `${shopId}-Q${currentQuarter}-expenses`,
      totalExpenses
    );

    localStorage.setItem(
      `${shopId}-Q${currentQuarter}-submitted`,
      "true"
    );

    sessionStorage.removeItem("authenticatedShop");

    if (currentQuarter === "4") {
      navigate(`/final/${shopId}`, {
        replace: true
      });
    } else {
      navigate(`/waiting/${shopId}`, {
        replace: true
      });
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h1 style={styles.title}>Purchase Order</h1>

        <div style={styles.budgetBox}>
          Q{currentQuarter} Budget: $
          {BUDGET.toLocaleString()}
          {isOverBudget && (
            <div style={styles.warning}>
              ⚠ Over Budget!
            </div>
          )}
        </div>

        {TOYS.map((toy) => (
          <div key={toy.id} style={styles.card}>
            <div style={styles.toyName}>
              {toy.name}
            </div>

            <div style={styles.priceLine}>
              Unit: ${toy.unitPrice} | Sell: $
              {toy.sellingPrice}
            </div>

            <div style={styles.quantityRow}>
              {ORDER_OPTIONS.map((qty) => (
                <button
                  key={qty}
                  style={{
                    ...styles.qtyButton,
                    ...(orders[toy.id] === qty
                      ? styles.selected
                      : {})
                  }}
                  onClick={() =>
                    handleOrderChange(toy.id, qty)
                  }
                >
                  {qty}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div style={styles.summary}>
          <div>
            Toy Expenses: $
            {toyExpenses.toLocaleString()}
          </div>
          <div>
            Business Expenses: $
            {businessExpenses.toLocaleString()}
          </div>
          <div style={{ fontWeight: "bold" }}>
            🔮 Estimated Revenue: $
            {predictedRevenue.toLocaleString()}
          </div>
        </div>

        <button
          style={styles.submit}
          onClick={handleSubmit}
        >
          Submit
        </button>
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
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "60px 20px",
    textAlign: "center"
  },
  title: {
    fontFamily: "Funkids",
    fontSize: "64px",
    marginBottom: "40px"
  },
  budgetBox: {
    background: "white",
    padding: "20px",
    borderRadius: "25px",
    marginBottom: "40px",
    fontSize: "38px"
  },
  warning: {
    color: "red",
    fontWeight: "bold",
    marginTop: "10px"
  },
  card: {
    background: "white",
    padding: "25px",
    borderRadius: "25px",
    marginBottom: "25px"
  },
  toyName: {
    fontSize: "30px",
    fontWeight: "bold"
  },
  priceLine: {
    fontSize: "24px",
    marginBottom: "15px"
  },
  quantityRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "10px"
  },
  qtyButton: {
    padding: "10px",
    fontSize: "24px",
    borderRadius: "20px"
  },
  selected: {
    background: "#fff8e1",
    border: "2px solid #ffcc66"
  },
  summary: {
    background: "white",
    padding: "20px",
    borderRadius: "25px",
    marginTop: "20px",
    fontSize: "30px"
  },
  submit: {
    marginTop: "25px",
    padding: "24px",
    background: "#d385ec",
    fontFamily: "Funkids",
    fontSize: "40px",
    borderRadius: "20px"
  }
};