import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const BUSINESS_BUDGET = 20000;

const RENT_OPTIONS = [
  { label: "Smaller location", cost: 4000, multiplier: 0.9 },
  { label: "Keep current location", cost: 9000, multiplier: 1.0 },
  { label: "Add funhouse expansion", cost: 12000, multiplier: 1.1 }
];

const LABOR_OPTIONS = [
  { label: "$15/hr staff", cost: 2500, multiplier: 0.8 },
  { label: "$20/hr staff", cost: 5000, multiplier: 1.0 },
  { label: "$25/hr staff", cost: 7500, multiplier: 1.1 }
];

const INSURANCE_OPTIONS = [
  { label: "No insurance", cost: 0 },
  { label: "Basic insurance", cost: 1000 },
  { label: "Full coverage insurance", cost: 3000 }
];

export default function StrategyPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();

  const [gameState, setGameState] = useState(null);
  const [currentQuarter, setCurrentQuarter] = useState(1);
  const [rent, setRent] = useState(null);
  const [labor, setLabor] = useState(null);
  const [insurance, setInsurance] = useState(null);

  /* 🔐 SESSION AUTH */
  useEffect(() => {
    const authenticated = sessionStorage.getItem("authenticatedShop");
    if (authenticated !== shopId) {
      navigate(`/login/${shopId}`);
    }
  }, [shopId, navigate]);

  /* 🔄 Load Game State + Strategy Gate */
  useEffect(() => {
  const loadState = async () => {
    const gameSnap = await getDoc(doc(db, "gameState", "main"));
    if (!gameSnap.exists()) return;

    const gameData = gameSnap.data();
    setGameState(gameData);

    const activeQuarter = gameData.currentQuarter;
    setCurrentQuarter(activeQuarter);

    const strategyOpen =
      gameData?.[`Q${activeQuarter}StrategyOpen`] === true;

    const quarterSnap = await getDoc(
      doc(db, "quarters", `Q${activeQuarter}`)
    );

    let alreadySubmitted = false;

    if (quarterSnap.exists()) {
      const data = quarterSnap.data();
      const storeData = data?.stores?.[shopId];
      alreadySubmitted = storeData?.strategySubmitted === true;
    }

    if (alreadySubmitted) {
      navigate(`/waiting/${shopId}`, { replace: true });
      return;
    }

    if (!strategyOpen) {
      navigate(`/hub/${shopId}`, { replace: true });
    }
  };

  loadState();
}, [shopId, navigate]);

  const total =
    (rent?.cost || 0) +
    (labor?.cost || 0) +
    (insurance?.cost || 0);

  const isOverBudget = total > BUSINESS_BUDGET;

  const handleContinue = async () => {
    if (!rent || !labor || insurance === null) {
      alert("Please choose Rent, Labor, and Insurance.");
      return;
    }

    if (isOverBudget) {
      alert("You are over the business budget.");
      return;
    }

    const quarterRef = doc(db, "quarters", `Q${currentQuarter}`);

    await setDoc(quarterRef, {}, { merge: true });

    await updateDoc(quarterRef, {
  [`stores.${shopId}.strategySubmitted`]: true,

  [`stores.${shopId}.businessExpenses`]: total,

  [`stores.${shopId}.rentCost`]: rent.cost,
  [`stores.${shopId}.rentLabel`]: rent.label,

  [`stores.${shopId}.laborCost`]: labor.cost,
  [`stores.${shopId}.laborLabel`]: labor.label,

  [`stores.${shopId}.insuranceCost`]: insurance.cost,
  [`stores.${shopId}.insuranceLabel`]: insurance.label,

  [`stores.${shopId}.buildingMultiplier`]: rent.multiplier,
  [`stores.${shopId}.laborMultiplier`]: labor.multiplier
});

    navigate(`/waiting/${shopId}`);
  };

  const renderSection = (title, options, selected, setSelected) => (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      {options.map((option, index) => (
        <div
          key={index}
          style={{
            ...styles.optionCard,
            ...(selected === option ? styles.selectedCard : {})
          }}
          onClick={() => setSelected(option)}
        >
          <div style={styles.cost}>
            ${option.cost.toLocaleString()}
          </div>
          <div>{option.label}</div>
        </div>
      ))}
    </div>
  );

  if (!gameState) return null;

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        <h1 style={styles.title}>
          Business Strategy
        </h1>

        <div style={styles.budgetBox}>
          Business Budget: ${BUSINESS_BUDGET.toLocaleString()}
          {isOverBudget && (
            <div style={styles.warning}>
              ⚠ Over Budget!
            </div>
          )}
        </div>

        {renderSection("🏠 Rent", RENT_OPTIONS, rent, setRent)}
        {renderSection("👩‍💼 Labor", LABOR_OPTIONS, labor, setLabor)}
        {renderSection("🛡 Insurance", INSURANCE_OPTIONS, insurance, setInsurance)}

        <div style={styles.summary}>
          Total Business Expenses: ${total.toLocaleString()}
        </div>

        <button
          style={styles.primaryButton}
          onClick={handleContinue}
        >
          Submit Strategy
        </button>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #d385ec 0%, #a3e7f0 100%)"
  },
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "60px 20px",
    textAlign: "center"
  },
  title: {
    fontFamily: "Funkids",
    fontSize: "60px",
    marginBottom: "40px"
  },
  budgetBox: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "25px",
    marginBottom: "40px",
    fontSize: "22px"
  },
  warning: {
    color: "red",
    marginTop: "10px",
    fontWeight: "bold"
  },
  section: {
    marginBottom: "40px"
  },
  sectionTitle: {
    fontSize: "28px",
    marginBottom: "20px"
  },
  optionCard: {
    backgroundColor: "white",
    padding: "25px",
    borderRadius: "25px",
    marginBottom: "15px",
    cursor: "pointer",
    fontSize: "20px"
  },
  selectedCard: {
    border: "3px solid #ffcc66",
    backgroundColor: "#fff8e1"
  },
  cost: {
    fontWeight: "bold",
    fontSize: "24px"
  },
  summary: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "25px",
    marginBottom: "30px",
    fontSize: "22px"
  },
  primaryButton: {
    padding: "20px",
    borderRadius: "45px",
    backgroundColor: "#ffcc66",
    border: "none",
    fontFamily: "Funkids",
    fontSize: "26px",
    cursor: "pointer"
  }
};