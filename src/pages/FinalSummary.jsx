import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const STORES = [
  {
    id: "imagination",
    name: "Imagination Station",
    students: ["Coach Store"]
  },
  {
    id: "toytopia",
    name: "Toytopia",
    students: ["Sebastian", "Amara", "Brooke", "Lizzie", "Pedro"]
  },
  {
    id: "giggles",
    name: "Giggles and Gizmos",
    students: ["Levi", "Zoe", "Tiernan", "Tyler", "Nico"]
  },
  {
    id: "tinkertown",
    name: "Tinkertown Toys",
    students: ["Zenovia", "Miera", "Silas", "Teddy"]
  },
  {
    id: "playmotion",
    name: "PlayMotion",
    students: ["Maggie", "Aria", "Vincent", "Evan", "Jace"]
  },
  {
    id: "cranium",
    name: "Cranium Emporium",
    students: ["Django", "Keane", "Evangeline", "Tigo"]
  }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [quarterData, setQuarterData] = useState({});

  const currentQuarter =
    localStorage.getItem("currentQuarter") || "1";

  const quarterMap = {
    "1": "Quarter One ❄️",
    "2": "Quarter Two 🌷",
    "3": "Quarter Three ☀️",
    "4": "Quarter Four 🍁"
  };

  useEffect(() => {
    const loadData = async () => {
      let allData = {};

      for (let q = 1; q <= 4; q++) {
        const snap = await getDoc(
          doc(db, "quarters", `Q${q}`)
        );

        if (snap.exists()) {
          allData[q] = snap.data();
        }
      }

      setQuarterData(allData);
    };

    loadData();
  }, []);

  const getProfit = (storeId, quarter) => {
    const released =
      localStorage.getItem(`Q${quarter}-released`) === "true";

    if (!released) return "";

    const stores =
      quarterData?.[quarter]?.stores || {};

    const final =
      stores?.[storeId]?.finalRevenue || 0;

    const expenses =
      stores?.[storeId]?.expenses || 0;

    const profit = final - expenses;

    return `$${profit.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const getTotalProfit = (storeId) => {
    let total = 0;

    for (let q = 1; q <= 4; q++) {
      const released =
        localStorage.getItem(`Q${q}-released`) === "true";

      if (!released) continue;

      const stores =
        quarterData?.[q]?.stores || {};

      const final =
        stores?.[storeId]?.finalRevenue || 0;

      const expenses =
        stores?.[storeId]?.expenses || 0;

      total += final - expenses;
    }

    return total;
  };

  const isGameComplete =
    localStorage.getItem("Q4-released") === "true";

  let winnerName = "";
  let highestProfit = -Infinity;

  if (isGameComplete) {
    STORES.forEach((store) => {
      const total =
        getTotalProfit(store.id);

      if (total > highestProfit) {
        highestProfit = total;
        winnerName = store.name;
      }
    });
  }

  const topRow = STORES.slice(0, 3);
  const bottomRow = STORES.slice(3, 6);

  const renderRow = (stores) => (
    <div style={styles.row}>
      {stores.map((store) => (
        <div key={store.id} style={styles.storeCard}>
          <div
            style={styles.imageWrapper}
            onClick={() =>
              navigate(`/hub/${store.id}`)
            }
          >
            <img
              src={`/images/${store.id}.png`}
              alt={store.name}
              style={styles.storeImage}
            />
          </div>

          <div style={styles.storeName}>
            {store.name}
          </div>

          <div style={styles.studentList}>
            {store.students.map((name) => (
              <div key={name}>{name}</div>
            ))}
          </div>

          {[1, 2, 3, 4].map((q) => (
            <div key={q} style={styles.profitRow}>
              <strong>Profit Q{q}:</strong>{" "}
              {getProfit(store.id, q)}
            </div>
          ))}

          <div style={styles.totalProfitRow}>
            <strong>Total Profit:</strong>{" "}
            ${getTotalProfit(
              store.id
            ).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        <h1 style={styles.banner}>
          Toy Shop Battle
        </h1>

        <div style={styles.tracker}>
          {isGameComplete ? (
            <>
              🎉 <strong>All Done!</strong>
              <br />
              🏆 Overall Winner:{" "}
              <strong>{winnerName}</strong>
            </>
          ) : (
            <>
              Currently in:{" "}
              <strong>
                {quarterMap[currentQuarter]}
              </strong>
            </>
          )}
        </div>

        {renderRow(topRow)}
        {renderRow(bottomRow)}
      </div>

      <div style={styles.teacherLinkWrapper}>
        <button
          style={styles.teacherLink}
          onClick={() =>
            navigate("/admin")
          }
        >
          Chloe Only
        </button>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #d385ec 0%, #a3e7f0 100%)"
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "60px 20px",
    textAlign: "center"
  },
  banner: {
    fontFamily: "Funkids",
    fontSize: "180px",
    marginBottom: "30px"
  },
  tracker: {
    fontSize: "26px",
    backgroundColor: "#fff8e1",
    padding: "20px",
    borderRadius: "25px",
    marginBottom: "40px"
  },
  row: {
    display: "flex",
    justifyContent: "center",
    gap: "30px",
    marginBottom: "50px"
  },
  storeCard: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "30px",
    width: "320px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)"
  },
  imageWrapper: {
    cursor: "pointer"
  },
  storeImage: {
    width: "260px",
    borderRadius: "20px",
    marginBottom: "15px"
  },
  storeName: {
    fontWeight: "bold",
    fontFamily: "Funkids",
    fontSize: "40px",
    marginBottom: "15px"
  },
  studentList: {
    fontSize: "25px",
    marginBottom: "15px"
  },
  profitRow: {
    fontSize: "22px",
    marginBottom: "6px"
  },
  totalProfitRow: {
    fontSize: "24px",
    marginTop: "12px",
    fontWeight: "bold",
    borderTop: "2px solid #ddd",
    paddingTop: "10px"
  },
  teacherLinkWrapper: {
    marginTop: "60px",
    textAlign: "right"
  },
  teacherLink: {
    background: "none",
    border: "none",
    color: "#888",
    fontSize: "16px",
    cursor: "pointer",
    fontFamily: "Funkids"
  }
};