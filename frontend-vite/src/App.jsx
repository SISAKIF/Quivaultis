import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Store from "./pages/Store";
import CustomerLayout from "./components/CustomerLayout";
import CustomerDashboard from "./pages/CustomerDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import OwnedGames from "./pages/OwnedGames";
import MoodAI from "./pages/MoodAI";
import Deals from "./pages/Deals";
import Marketplace from "./pages/Marketplace";
import Report from "./pages/Report";
import CommunityReviews from "./pages/CommunityReviews";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/customer"
        element={
          <ProtectedRoute allowRoles={["customer"]}>
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CustomerDashboard />} />
        <Route path="deals" element={<Deals />} />
        <Route path="profile" element={<Profile />} />
        <Route path="store" element={<Store />} />
        <Route path="owned-games" element={<OwnedGames />} />
        <Route path="mood-ai" element={<MoodAI />} />
        <Route path="marketplace" element={<Marketplace />} />
        <Route path="report" element={<Report />} />
        <Route path="community-reviews" element={<CommunityReviews />} />
      </Route>

      <Route
        path="/staff"
        element={
          <ProtectedRoute allowRoles={["staff"]}>
            <StaffDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<StaffDashboard />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}