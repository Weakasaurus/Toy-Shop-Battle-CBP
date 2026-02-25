import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { calculateMarket } from "../engine/marketEngine";

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

  const currentQuarter =
    localStorage.getItem("currentQuarter") || "1";

  /* 🔐 Session login guard */
  useEffect(() => {
    const authenticated =
      sessionStorage.getItem("authenticatedShop");

    if (authenticated !== shopId) {
      navigate(`/login/${shopId}`, { replace: true });
    }
  }, [shopId, navigate]);

  /* 🧠 RUN MARKET ONCE WHEN ALL SUBMITTED */
  useEffect(() => {
    const allSubmitted = ALL_SHOPS.every(id =>
      localStorage.getItem(
        `${id}-Q${currentQuarter}-submitted`
      ) === "true"
    );

    const alreadyCalculated =
      localStorage.getItem(
        `Q${currentQuarter}-calculated`
      ) === "true";

    if (allSubmitted && !alreadyCalculated) {
      const teams = ALL_SHOPS.map(id => ({
        id,
        orders: JSON.parse(
          localStorage.getItem(
            `${id}-Q${currentQuarter}-orders`
          ) || "{}"
        )
      }));

      const results = calculateMarket(teams, currentQuarter);

      ALL_SHOPS.forEach(id => {
        const shopResults = results[id];

        localStorage.setItem(
          `${id}-Q${currentQuarter}-baseRevenue`,
          shopResults.baseRevenue
        );

        localStorage.setItem(
          `${id}-Q${currentQuarter}-buildingRevenue`,
          shopResults.buildingRevenue
        );

        localStorage.setItem(
          `${id}-Q${currentQuarter}-finalRevenue`,
          shopResults.finalRevenue
        );

        localStorage.setItem(
          `${id}-Q${currentQuarter}-sold`,
          JSON.stringify(shopResults.sold)
        );
      });

      localStorage.setItem(
        `Q${currentQuarter}-calculated`,
        "true"
      );
    }
  }, [currentQuarter]);

  /* 🔓 If released, send to results */
  useEffect(() => {
    const released =
      localStorage.getItem(
        `Q${currentQuarter}-released`
      ) === "true";

    if (released) {
      navigate(`/results/${shopId}`, {
        replace: true
      });
    }
  }, [shopId, currentQuarter, navigate]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h1 style={styles.title}>
          Waiting for Coach...
        </h1>

        <p style={styles.message}>
          Your quarter has been submitted.
          Results will appear once released.
        </p>

        <button
          style={styles.button}
          onClick={() => navigate("/")}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #d385ec 0%, #a3e7f0 100%)"
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