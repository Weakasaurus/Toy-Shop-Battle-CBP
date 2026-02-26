import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import useGameState from "../useGameState";

const quarterMap = {
  1: "Quarter One ❄️",
  2: "Quarter Two 🌷",
  3: "Quarter Three ☀️",
  4: "Quarter Four 🎁"
};

const SHOP_DATA = {
  imagination: {
    name: "Imagination Station",
    founderImage: "/images/imagination.png",
    story: `
<p>After traveling the world collecting craft ideas...</p>
`,
    target: "4–8 year old artists",
    goal: "Attract tinkerers & crafters who might not yet see themselves as artists (age 4–8)."
  },

  toytopia: {
    name: "Toytopia",
    founderImage: "/images/toytopia.png",
    story: `
<p>Founded by Rebecca Blythe...</p>
`,
    target: "3–6 year olds",
    goal: "Attract older siblings (7–10), but stick with the store's theme!"
  },

  giggles: {
    name: "Giggles and Gizmos",
    founderImage: "/images/giggles.png",
    story: `
<p>Chip Powers, a retired tech engineer...</p>
`,
    target: "8–12 year old tech lovers",
    goal: "Add active toys"
  },

  tinkertown: {
    name: "Tinkertown Toys",
    founderImage: "/images/tinkertown.png",
    story: `
<p>Located in a refurbished train station...</p>
`,
    target: "6–11 year olds",
    goal: "Balance classic toys with light tech"
  },

  playmotion: {
    name: "PlayMotion",
    founderImage: "/images/playmotion.png",
    story: `
<p>Former college athlete Riley Armstrong...</p>
`,
    target: "4–9 year old athletes",
    goal: "Add indoor adventure toys"
  },

  cranium: {
    name: "Cranium Emporium",
    founderImage: "/images/cranium.png",
    story: `
<p>The brilliant Cordelia Brownstein...</p>
`,
    target: "Educational toys for 9–13",
    goal: "Add younger customers (5–8)"
  }
};

export default function ShopHub() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const shop = SHOP_DATA[shopId];
  const { currentQuarter, released } = useGameState();

  // 🔐 Session login
  useEffect(() => {
    const auth = sessionStorage.getItem("authenticatedShop");
    if (auth !== shopId) {
      navigate(`/login/${shopId}`);
    }
  }, [shopId, navigate]);

  // 🔒 Firebase submission lock
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

  const releasedQuarters = [1, 2, 3, 4].filter(
    (q) => released[q]
  );

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <div style={styles.layout}>
          <div style={styles.left}>
            <h1 style={styles.title}>
              About {shop.name}
            </h1>

            <div
              style={styles.story}
              dangerouslySetInnerHTML={{
                __html: shop.story
              }}
            />
          </div>

          <div style={styles.right}>
            <img
              src={shop.founderImage}
              alt=""
              style={styles.image}
            />

            <div style={styles.targetBox}>
              <h3>🎯 Current Target:</h3>
              <p>{shop.target}</p>

              <h3>💪 Goal:</h3>
              <p>{shop.goal}</p>
            </div>
          </div>
        </div>

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

          {releasedQuarters.map((q) => (
            <button
              key={q}
              style={styles.secondary}
              onClick={() =>
                navigate(`/results/${shopId}`)
              }
            >
              View {quarterMap[q]} Results
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

const styles = {
  wrapper: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #d385ec 0%, #a3e7f0 100%)"
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "60px 20px"
  },
  layout: {
    display: "flex",
    gap: "60px"
  },
  left: { flex: 2 },
  right: { flex: 1 },
  title: {
    fontFamily: "Funkids",
    fontSize: "64px"
  },
  story: {
    background: "white",
    padding: "30px",
    borderRadius: "25px",
    marginTop: "20px",
    lineHeight: "1.6",
    fontSize: "26px"
  },
  image: {
    width: "100%",
    borderRadius: "25px",
    marginBottom: "20px"
  },
  targetBox: {
    background: "white",
    padding: "20px",
    borderRadius: "25px",
    textAlign: "center",
    fontSize: "24px"
  },
  buttons: {
    marginTop: "40px",
    display: "flex",
    flexDirection: "column",
    gap: "15px"
  },
  primary: {
    padding: "18px",
    fontFamily: "Funkids",
    fontSize: "24px",
    borderRadius: "20px",
    background: "#d385ec"
  },
  secondary: {
    padding: "16px",
    fontFamily: "Funkids",
    borderRadius: "20px"
  },
  final: {
    padding: "20px",
    fontFamily: "Funkids",
    fontSize: "26px"
  }
};