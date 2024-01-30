import Home from "./pages/Home";
import Lookup from "./pages/Lookup";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" exact element={<Home />} />
        <Route path="/search" exact element={<Lookup />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
