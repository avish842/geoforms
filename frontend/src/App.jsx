import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import RegisterUser from "./pages/RegisterUser";
import Profile from './pages/Profile';
import Login from "./pages/Login";
import CreateForm from "./pages/CreateForm";
import FillForm from "./pages/FillForm";

function App() {
  return (
     <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<RegisterUser />} />
        <Route path ='/login' element={<Login/>}/>
        <Route path="/profile" element={<Profile />} />
        <Route path="/form/:formId/edit" element={<CreateForm />} />
        <Route path="/form/:formId/fill" element={<FillForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
