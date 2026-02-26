import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

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
<p>After traveling the world collecting craft ideas, young artists Luna and Leo transformed an old artist's studio into Imagination Station. The store's walls, splattered with paint from past artists, evoke creativity for <strong>young artists aged 4–8.</strong></p>

<p>These sibling founders’ early success was driven by a deal with a famous craft kit manufacturer, but rising production costs have reduced profits. To attract more than just artists to the store, they’re exploring adding <strong>more creative toys</strong> that aren’t necessarily just about art: think crafts, costumes, books, creative games, and even toys that allow kids to build!</p>
`,
    target: "4–8 year old artists",
    goal: "Attract tinkerers & crafters who might not yet see themselves as artists (age 4–8)."
  },

  toytopia: {
    name: "Toytopia",
    founderImage: "/images/toytopia.png",
    story: `
<p>Founded by Rebecca Blythe in a colorful building once rumored to be a circus tent, Toytopia became Amsirp's wonderland for <strong>youngsters aged 3–6.</strong> The store's iconic carousel right at the entrance is a testament to its playful origins. Toytopia has thrived with toys blending fun and learning.</p>

<p>However, due to a recent bad investment in a large batch of unpopular toys, they need to bring in more income. <strong>While their educational toys for 3–6 year olds are popular</strong>, Mrs. Blythe has been considering a new section dedicated to popular storybook & pop culture characters, <strong>hoping to attract older siblings, aged 7–10</strong>, into the world of classic tales and adventures.</p>
`,
    target: "3–6 year olds",
    goal: "Attract older siblings (7–10), but stick with the store's theme!"
  },

  giggles: {
    name: "Giggles and Gizmos",
    founderImage: "/images/giggles.png",
    story: `
<p>Chip Powers, a retired tech engineer, turned an old radio repair shop into Giggles & Gizmos. Its neon-lit aisles give it a futuristic ambiance, attracting <strong>tech enthusiasts aged 8–12.</strong> An early investment in a best-selling robotic toy put them on the map.</p>

<p>Although Mr. Powers still wants to appeal to his tech-savvy customers, he wants to <strong>appeal to parents and kids in this age group who want a break from technology</strong> to get moving. He’s considering stocking more active and sports toys in the same age range to address these needs.</p>
`,
    target: "8–12 year old tech lovers",
    goal: "Add active toys"
  },

 tinkertown: {
    name: "Tinkertown Toys",
    founderImage: "/images/tinkertown.png",
    story: `
<p>Located in a refurbished train station, Tinkertown Toys draws <strong>families with children aged 6–11.</strong> Tim Tinker collects antique toys and makes his own wooden toys to sell in his shop. With a special emphasis on classic toys, the shop is a favorite among those who appreciate the charm of yesteryear.</p>

<p>Initially, their old-fashioned toy collection garnered high sales, but cheaper versions in the market have impacted profits. Tim wants to <strong>keep his reputation</strong> as a place for classic toys, but <strong>add in some newer toys</strong> that incorporate some technology, but not too much.</p>
`,
    target: "6–11 year olds",
    goal: "Balance classic toys with light tech"
  },

  playmotion: {
    name: "PlayMotion",
    founderImage: "/images/playmotion.png",
    story: `
<p>Former college athlete Riley Armstrong used her passion for sports to start a toy store all about action. Housed in a renovated gymnasium, PlayMotion's high ceilings are perfect for testing out outdoor toys and sports equipment, targeting kids aged <strong>4–9.</strong></p>

<p>Despite their unique setup, they recently faced challenges selling toys in colder months. Riley wants to expand into toys that appeal to <strong>kids who love adventure</strong>, even if they aren’t outdoor or sports toys.</p>
`,
    target: "4–9 year old athletes",
    goal: "Add indoor adventure toys"
  },

  cranium: {
    name: "Cranium Emporium",
    founderImage: "/images/cranium.png",
    story: `
<p>The brilliant Cordelia Brownstein left her job as a librarian to found Cranium Emporium. The relaxing shop lined with bookshelves specializes in brain-teasing puzzles, board games, and kits that <strong>challenge young minds aged 9–13.</strong></p>

<p>Though she believes strongly in the power of educational toys for older kids, she wants to develop the minds of younger children as well.</p>
`,
    target: "Educational toys for 9–13",
    goal: "Add younger customers (5–8)"
  }
};

export default function ShopHub() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const shop = SHOP_DATA[shopId];

  const [gameState, setGameState] = useState(null);

  /* 🔐 Session Guard */
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
      if (snap.exists()) {
        setGameState(snap.data());
      }
    };
    loadState();
  }, []);

  if (!shop || !gameState) return null;

  const activeQuarter = gameState.currentQuarter;

  const strategyOpen =
    gameState[`Q${activeQuarter}StrategyOpen`] === true;

  const purchaseOpen =
    gameState[`Q${activeQuarter}PurchaseOpen`] === true;

  const resultsReleased =
    gameState[`Q${activeQuarter}ResultsReleased`] === true;

  const releasedQuarters = [1, 2, 3, 4].filter(
    (q) => gameState[`Q${q}ResultsReleased`]
  );

  const isFinalComplete =
    gameState.Q4ResultsReleased === true;

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <div style={styles.layout}>
          <div style={styles.left}>
            <h1 style={styles.title}>About {shop.name}</h1>
            <div
              style={styles.story}
              dangerouslySetInnerHTML={{ __html: shop.story }}
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
          {/* Strategy Stage */}
          {strategyOpen && (
            <button
              style={styles.primary}
              onClick={() => navigate(`/strategy/${shopId}`)}
            >
              Start Strategy
            </button>
          )}

          {/* Purchase Stage */}
          {purchaseOpen && (
            <button
              style={styles.primary}
              onClick={() => navigate(`/purchase/${shopId}`)}
            >
              Start Purchase
            </button>
          )}

          {/* Results Stage */}
          {resultsReleased && (
            <button
              style={styles.secondary}
              onClick={() => navigate(`/results/${shopId}`)}
            >
              View {quarterMap[activeQuarter]} Results
            </button>
          )}

          {/* Previous Results */}
          {releasedQuarters
            .filter((q) => q !== activeQuarter)
            .map((q) => (
              <button
                key={q}
                style={styles.secondary}
                onClick={() => navigate(`/results/${shopId}`)}
              >
                View {quarterMap[q]} Results
              </button>
            ))}

          {/* Final Summary */}
          {isFinalComplete && (
            <button
              style={styles.final}
              onClick={() => navigate(`/final/${shopId}`)}
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
    padding: "18px",
    fontFamily: "Funkids",
    fontSize: "24px",
    borderRadius: "20px"
  },
  final: {
    padding: "20px",
    fontFamily: "Funkids",
    fontSize: "26px"
  }
};