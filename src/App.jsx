import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginButton from "./components/LoginButton";
import Callback from "./pages/Callback";
import Dashboard from "./pages/Dashboard";
import { Analytics } from "@vercel/analytics/react"

export default function App() {
  return (
   
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginButton />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  );
}