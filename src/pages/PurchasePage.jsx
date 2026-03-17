import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Q1_TOYS } from "../data/toys";
import { Q2_TOYS } from "../data/q2Toys";
import { Q3_TOYS } from "../data/q3Toys";
import { Q4_TOYS } from "../data/q4Toys";

import { db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot
} from "firebase/firestore";

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

  const [gameState, setGameState] = useState(null);
  const [currentQuarter, setCurrentQuarter] = useState(1);
  const [orders, setOrders] = useState({});
  const [predictedRevenue, setPredictedRevenue] = useState(0);
  const [estimatedProfit, setEstimatedProfit] = useState(0);
  const [businessExpenses, setBusinessExpenses] = useState(0);
  const [liveStores, setLiveStores] = useState({});

  /* 🔐 SESSION LOGIN */
  useEffect(() => {
    const auth = sessionStorage.getItem("authenticatedShop");
    if (auth !== shopId) {
      navigate(`/login/${shopId}`);
    }
  }, [shopId, navigate]);

  /* 🔄 Load Game State */
  useEffect(() => {
    const loadState = async () => {
      const snap = await getDoc(doc(db, "gameState", "main"));
      if (!snap.exists()) return;

      const data = snap.data();
      setGameState(data);

      const activeQuarter = data.currentQuarter;
      setCurrentQuarter(activeQuarter);

      const purchaseOpen =
        data?.[`Q${activeQuarter}PurchaseOpen`] === true;

      const quarterSnap = await getDoc(
        doc(db, "quarters", `Q${activeQuarter}`)
      );

      let alreadySubmitted = false;

      if (quarterSnap.exists()) {
        const quarterData = quarterSnap.data();
        const storeData = quarterData?.stores?.[shopId];

        alreadySubmitted = storeData?.submitted === true;
      }

      if (alreadySubmitted) {
        navigate(`/waiting/${shopId}`, { replace: true });
        return;
      }

      if (!purchaseOpen) {
        navigate(`/hub/${shopId}`, { replace: true });
      }
    };

    loadState();
  }, [shopId, navigate]);

  /* 📥 Load Store Data */
  useEffect(() => {
    const loadStore = async () => {
      if (!gameState) return;

      const quarterRef = doc(db, "quarters", `Q${currentQuarter}`);
      const snap = await getDoc(quarterRef);

      if (snap.exists()) {
        const data = snap.data();
        const storeData = data?.stores?.[shopId];

        if (storeData?.orders) {
          setOrders(storeData.orders);
        }

        if (storeData?.businessExpenses) {
          setBusinessExpenses(storeData.businessExpenses);
        }
      }
    };

    loadStore();
  }, [gameState, shopId, currentQuarter]);

  /* 🔴 LIVE MARKET LISTENER */
  useEffect(() => {
    if (!gameState) return;

    const quarterRef = doc(db, "quarters", `Q${currentQuarter}`);

    const unsubscribe = onSnapshot(quarterRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setLiveStores(data?.stores || {});
      }
    });

    return () => unsubscribe();
  }, [gameState, currentQuarter]);

  /* 🔮 LIVE ESTIMATION */
  useEffect(() => {
    if (!gameState) return;

    const TOYS =
      currentQuarter === 2
        ? Q2_TOYS
        : currentQuarter === 3
        ? Q3_TOYS
        : currentQuarter === 4
        ? Q4_TOYS
        : Q1_TOYS;

    const marketTotals = {};

    Object.values(liveStores).forEach((store) => {
      const storeOrders = store?.orders || {};

      Object.keys(storeOrders).forEach((toyId) => {
        marketTotals[toyId] =
          (marketTotals[toyId] || 0) +
          safeNumber(storeOrders[toyId]);
      });
    });

    let totalRevenue = 0;
    let totalProfit = 0;

    Object.keys(orders).forEach((toyId) => {
      const toy = TOYS.find((t) => t.id === toyId);
      if (!toy) return;

      const yourOrders = safeNumber(orders[toyId]);
      const totalMarket = marketTotals[toyId] || 0;

      let estimatedSold = 0;

      if (totalMarket > 0) {
        const share = yourOrders / totalMarket;
        estimatedSold = share * toy.baseDemand;
      }

      estimatedSold = Math.min(estimatedSold, yourOrders);

      const revenue =
        estimatedSold * safeNumber(toy.sellingPrice);

      const cost =
        yourOrders * safeNumber(toy.unitPrice);

      totalRevenue += revenue;
      totalProfit += revenue - cost;
    });

    setPredictedRevenue(Math.round(totalRevenue * 100) / 100);
    setEstimatedProfit(Math.round(totalProfit * 100) / 100);
  }, [orders, liveStores, currentQuarter, gameState]);

  if (!gameState) return null;

  const TOYS =
    currentQuarter === 2
      ? Q2_TOYS
      : currentQuarter === 3
      ? Q3_TOYS
      : currentQuarter === 4
      ? Q4_TOYS
      : Q1_TOYS;

  const BUDGET =
    currentQuarter === 4 ? 15000 : 10000;

  const toyExpenses = TOYS.reduce(
    (sum, toy) =>
      sum +
      safeNumber(orders[toy.id]) *
        safeNumber(toy.unitPrice),
    0
  );

  const isOverBudget = toyExpenses > BUDGET;

  const handleOrderChange = async (toyId, qty) => {
    const updated = {
      ...orders,
      [toyId]: qty
    };
    setOrders(updated);

    const quarterRef = doc(
      db,
      "quarters",
      `Q${currentQuarter}`
    );

    await setDoc(quarterRef, {}, { merge: true });

    await updateDoc(quarterRef, {
      [`stores.${shopId}.orders`]: updated,
      [`stores.${shopId}.submitted`]: false
    });
  };

  const handleSubmit = async () => {
    if (isOverBudget) {
      alert("Reduce toy order. You are over budget.");
      return;
    }

    const totalExpenses =
      toyExpenses + businessExpenses;

    const quarterRef = doc(
      db,
      "quarters",
      `Q${currentQuarter}`
    );

    await updateDoc(quarterRef, {
      [`stores.${shopId}.submitted`]: true,
      [`stores.${shopId}.expenses`]:
        totalExpenses
    });

    navigate(`/waiting/${shopId}`);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h1 style={styles.title}>
          Purchase Order
        </h1>

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
              Unit: ${toy.unitPrice} | Sell: ${toy.sellingPrice}
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
            Toy Expenses: ${toyExpenses.toLocaleString()}
          </div>
          <div>
            Business Expenses: ${businessExpenses.toLocaleString()}
          </div>

          <div style={{ fontWeight: "bold" }}>
            🔮 Estimated Revenue: ${predictedRevenue.toLocaleString()}
          </div>

          <div
            style={{
              fontWeight: "bold",
              color: estimatedProfit >= 0 ? "green" : "red"
            }}
          >
            💰 Estimated Profit: ${estimatedProfit.toLocaleString()}
          </div>
        </div>

        <button
          style={styles.submit}
          onClick={handleSubmit}
        >
          Submit Purchase
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
    gridTemplateColumns:
      "repeat(4, 1fr)",
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