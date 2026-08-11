import React from "react";
import { createRoot } from "react-dom/client";
import LnurlTool from "../app/LnurlTool";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LnurlTool />
  </React.StrictMode>,
);
