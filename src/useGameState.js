import { useEffect, useState } from "react";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

export default function useGameState() {
  const [currentQuarter, setCurrentQuarter] = useState(1);
  const [released, setReleased] = useState({});

  useEffect(() => {
    const loadState = async () => {
      const snap = await getDoc(
        doc(db, "gameState", "main")
      );

      if (snap.exists()) {
        const data = snap.data();
        setCurrentQuarter(data.currentQuarter || 1);
        setReleased({
          1: data.Q1Released,
          2: data.Q2Released,
          3: data.Q3Released,
          4: data.Q4Released
        });
      }
    };

    loadState();
  }, []);

  return { currentQuarter, released };
}