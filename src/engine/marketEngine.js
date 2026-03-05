import { Q1_TOYS } from "../data/toys";
import { FIT_MATRIX as Q1_FIT_MATRIX } from "../data/fitMatrix";
import { Q2_TOYS } from "../data/q2Toys";
import { Q2_FIT_MATRIX } from "../data/q2FitMatrix";
import { Q3_TOYS } from "../data/q3Toys";
import { Q3_FIT_MATRIX } from "../data/q3FitMatrix";
import { Q4_TOYS } from "../data/q4Toys";
import { Q4_FIT_MATRIX } from "../data/q4FitMatrix";

function round2(n) {
  return Math.round(n * 100) / 100;
}

export function calculateMarket(teams, quarter) {
  const currentQuarter = String(quarter);

  let TOYS;
  let FIT_MATRIX;

  if (currentQuarter === "2") {
    TOYS = Q2_TOYS;
    FIT_MATRIX = Q2_FIT_MATRIX;
  } else if (currentQuarter === "3") {
    TOYS = Q3_TOYS;
    FIT_MATRIX = Q3_FIT_MATRIX;
  } else if (currentQuarter === "4") {
    TOYS = Q4_TOYS;
    FIT_MATRIX = Q4_FIT_MATRIX;
  } else {
    TOYS = Q1_TOYS;
    FIT_MATRIX = Q1_FIT_MATRIX;
  }

  const results = {};

  teams.forEach((team) => {
    results[team.id] = {
      baseRevenue: 0,
      buildingRevenue: 0,
      finalRevenue: 0,
      sold: {}
    };
  });

  TOYS.forEach((toy) => {
    const totalSupply = teams.reduce(
      (sum, team) => sum + (team.orders[toy.id] || 0),
      0
    );

    const adjustedTotalSupply = totalSupply + 1;

    teams.forEach((team) => {
      const teamOrder = team.orders[toy.id] || 0;

      // --- DEMAND SPLIT ---
      const share = teamOrder / adjustedTotalSupply;

      let baseSold = Math.round(share * toy.baseDemand);
      baseSold = Math.min(baseSold, teamOrder);

      const fitMultiplier =
        FIT_MATRIX[toy.id]?.[team.id] || 1;

      let actualSold = Math.round(baseSold * fitMultiplier);
      actualSold = Math.min(actualSold, teamOrder);

      results[team.id].sold[toy.id] = actualSold;

      // --- REVENUE ---
      const baseRevenue = round2(
        actualSold * toy.sellingPrice
      );
console.log(team.id, team.buildingMultiplier, team.laborMultiplier);
      // 🔥 FIX: use multipliers passed from Firebase
      const buildingMultiplier =
        team.buildingMultiplier || 1;

      const buildingRevenue = round2(
        baseRevenue * buildingMultiplier
      );

      const laborMultiplier =
        team.laborMultiplier || 1;

      const finalRevenue = round2(
        buildingRevenue * laborMultiplier
      );

      results[team.id].baseRevenue += baseRevenue;
      results[team.id].buildingRevenue += buildingRevenue;
      results[team.id].finalRevenue += finalRevenue;
    });
  });

  teams.forEach((team) => {
    results[team.id].baseRevenue = round2(
      results[team.id].baseRevenue
    );
    results[team.id].buildingRevenue = round2(
      results[team.id].buildingRevenue
    );
    results[team.id].finalRevenue = round2(
      results[team.id].finalRevenue
    );
  });

  return results;
}