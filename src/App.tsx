import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import AddPart from "@/pages/AddPart";
import EditPart from "@/pages/EditPart";
import PartDetail from "@/pages/PartDetail";
import Assemblies from "@/pages/Assemblies";
import PickTaskPage from "@/pages/PickTask";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/add" element={<AddPart />} />
        <Route path="/edit/:id" element={<EditPart />} />
        <Route path="/detail/:id" element={<PartDetail />} />
        <Route path="/assemblies" element={<Assemblies />} />
        <Route path="/pick/:id" element={<PickTaskPage />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}
