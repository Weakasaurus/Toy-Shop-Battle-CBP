import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import useGameState from "../useGameState";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

/* keep SHOP_DATA unchanged */

export default function ShopHub() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const shop = SHOP_DATA[shopId];
  const { currentQuarter, released } = useGameState();

  useEffect(() => {
    const auth = sessionStorage.getItem("authenticatedShop");
    if (auth !== shopId) {
      navigate(`/login/${shopId}`);
    }
  }, [shopId, navigate]);

  useEffect(() => {
    const checkLock = async () => {
      const snap = await getDoc(
        doc(db, "quarters", `Q${currentQuarter}`)
      );

      if (snap.exists()) {
        const data = snap.data();
        const storeData = data?.stores?.[shopId];

        if (
          storeData?.submitted &&
          !released[currentQuarter]
        ) {
          navigate(`/waiting/${shopId}`, {
            replace: true
          });
        }
      }
    };

    checkLock();
  }, [shopId, currentQuarter, released, navigate]);

  if (!shop) return <div>Shop Not Found</div>;

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        {/* layout unchanged */}

        <div style={styles.buttons}>
          {!released[currentQuarter] && (
            <button
              style={styles.primary}
              onClick={() =>
                navigate(`/strategy/${shopId}`)
              }
            >
              Start Current Quarter
            </button>
          )}

          {[1,2,3].filter(q => released[q]).map(q => (
            <button
              key={q}
              style={styles.secondary}
              onClick={() => navigate(`/results/${shopId}`)}
            >
              View Quarter {q} Results
            </button>
          ))}

          {released[4] && (
            <button
              style={styles.final}
              onClick={() =>
                navigate(`/final/${shopId}`)
              }
            >
              🎉 View Final Summary 🎉
            </button>
          )}
        </div>
      </div>
    </div>
  );
}