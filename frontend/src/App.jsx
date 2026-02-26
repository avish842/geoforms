import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import RegisterUser from "./pages/RegisterUser";
import Profile from './pages/Profile';
import Login from "./pages/Login";
import CreateForm from "./pages/CreateForm";
import FillForm from "./pages/FillForm";
import { MyForms } from "./pages/Forms";
import FormSetting from "./pages/FormSetting";
import Responses from "./pages/Responses";

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
        <Route path="/form/:formId/settings" element={<FormSetting />} />
        <Route path="/form/:formId/responses" element={<Responses />} />
        <Route path="/forms" element={<MyForms />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
