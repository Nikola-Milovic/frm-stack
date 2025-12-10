import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import AuthPage from "#pages/auth";
import IndexPage from "#pages";
import "./main.css";
import RootLayout from "#layout/root-layout";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <BrowserRouter>
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<IndexPage />} />
      </Route>
    </Routes>
  </BrowserRouter>,
);
