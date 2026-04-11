import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import LoginButton from "./components/LoginButton";
import SiteFooter from "./components/SiteFooter";
import Callback from "./pages/Callback";
import Dashboard from "./pages/Dashboard";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <div className="app-shell__glow app-shell__glow--left" />
        <div className="app-shell__glow app-shell__glow--right" />
        <main className="app-shell__content">
          <Routes>
            <Route path="/" element={<LoginButton />} />
            <Route path="/callback" element={<Callback />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
        <SiteFooter />
      </div>
      <Analytics />
    </BrowserRouter>
  );
}
