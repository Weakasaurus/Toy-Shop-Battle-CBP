import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

export default function WaitingPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();

  const [currentQuarter, setCurrentQuarter] = useState(1);
  const [gameState, setGameState] = useState({});

  /* 🔐 Session Guard */
  useEffect(() => {
    const authenticated =
      sessionStorage.getItem("authenticatedShop");

    if (authenticated !== shopId) {
      navigate(`/login/${shopId}`, { replace: true });
    }
  }, [shopId, navigate]);

  /* 🔄 Load Game State */
  useEffect(() => {
    const loadState = async () => {
      const gameSnap = await getDoc(
        doc(db, "gameState", "main")
      );

      if (gameSnap.exists()) {
        const data = gameSnap.data();
        setGameState(data);
        setCurrentQuarter(data.currentQuarter || 1);
      }
    };

    loadState();
  }, []);

  /* 🧠 Check Submissions + Run Market */
  useEffect(() => {
    const checkAndRunMarket = async () => {
      const quarterRef = doc(db, "quarters", `Q${gameState.currentQuarter}`);

      const snap = await getDoc(quarterRef);
      if (!snap.exists()) return;

      const data = snap.data();
      const stores = data?.stores || {};

      const allSubmitted = ALL_SHOPS.every(
        (id) => stores[id]?.submitted === true
      );

      const alreadyCalculated =
        data?.calculated === true;

      if (allSubmitted && !alreadyCalculated) {
        const teams = ALL_SHOPS.map((id) => ({
          id,
          orders: stores[id]?.orders || {}
        }));

        const results = calculateMarket(
          teams,
          currentQuarter
        );

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

        await updateDoc(quarterRef, {
          stores: updatedStores,
          calculated: true
        });
      }
 
    };

    if (currentQuarter) {
      checkAndRunMarket();
    }
  }, [shopId, currentQuarter, gameState, navigate]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h1 style={styles.title}>
          Waiting for Coach...
        </h1>

        <p style={styles.message}>
          Your quarter has been submitted successfully.
          <br />
          Results will appear once the coach releases them.
        </p>

<div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
  <button
    style={styles.button}
    onClick={() => navigate(`/hub/${shopId}`)}
  >
    Back to Hub
  </button>

  <button
    style={{
      ...styles.button,
      backgroundColor: "#ddd"
    }}
    onClick={() => navigate("/")}
  >
    Back to Home
  </button>
</div>
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
    maxWidth: "800px",
    margin: "0 auto",
    padding: "100px 20px",
    textAlign: "center"
  },
  title: {
    fontFamily: "Funkids",
    fontSize: "70px",
    marginBottom: "40px"
  },
  message: {
    fontSize: "24px",
    marginBottom: "40px"
  },
  button: {
    padding: "18px 50px",
    fontSize: "24px",
    borderRadius: "45px",
    border: "none",
    backgroundColor: "#ffcc66",
    fontFamily: "Funkids",
    cursor: "pointer"
  }
};