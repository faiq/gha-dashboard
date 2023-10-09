import Home from "./pages/Home";
import Lookup from "./pages/Lookup";
import Graph from "./pages/Graph";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { createContext, useState } from "react";

export const UserContext = createContext(null);

function App() {
  const [user, setUser] = useState(null);
  return (
    <BrowserRouter>
     <UserContext.Provider value={{ user: user, setUser: setUser }}>
       <Routes>
         <Route path="/" exact element={<Home />} />
         <Route path="/search" exact element={<Lookup />} />
         <Route path="/graph" exact element={<Graph />} />
       </Routes>
     </UserContext.Provider>
    </BrowserRouter>
  );
}

export default App;
