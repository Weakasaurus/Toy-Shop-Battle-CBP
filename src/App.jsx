import AdminPanel from "./pages/AdminPanel";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import ShopHub from "./pages/ShopHub";
import StrategyPage from "./pages/StrategyPage";
import PurchasePage from "./pages/PurchasePage";
import ResultsPage from "./pages/ResultsPage";
import FinalSummary from "./pages/FinalSummary";
import WaitingPage from "./pages/WaitingPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login/:shopId" element={<LoginPage />} />
      <Route path="/hub/:shopId" element={<ShopHub />} />
      <Route path="/strategy/:shopId" element={<StrategyPage />} />
      <Route path="/purchase/:shopId" element={<PurchasePage />} />
      <Route path="/results/:shopId" element={<ResultsPage />} />
      <Route path="/final/:shopId" element={<FinalSummary />} />
      <Route path="/waiting/:shopId" element={<WaitingPage />} />
    <Route path="/admin" element={<AdminPanel />} />
    </Routes>
  );
}