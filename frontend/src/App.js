import Home from "./pages/Home";
import Lookup from "./pages/Lookup";
import Graph from "./pages/Graph";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" exact element={<Home />} />
        <Route path="/search" exact element={<Lookup />} />
        <Route path="/graph" exact element={<Graph />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
