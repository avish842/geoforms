import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import Home from "./pages/Home";
import RegisterUser from "./pages/RegisterUser";
import Profile from './pages/Profile';
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import CreateForm from "./pages/CreateForm";
import FillForm from "./pages/FillForm";
import { MyForms } from "./pages/Forms";
import FormSetting from "./pages/FormSetting";
import Responses from "./pages/Responses";
import Plans from "./pages/Plans";
import SuperAdmin from "./pages/SuperAdmin";
import { DrawingProvider } from "./map_comp/context/DrawingContext";

function App() {
  return (
    <AuthProvider>
      <DrawingProvider> 
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<RegisterUser />} />
            <Route path ='/login' element={<Login/>}/>
            <Route path='/forgot-password' element={<ForgotPassword/>}/>
            <Route path="/profile" element={<Profile />} />
            <Route path="/form/:formId/edit" element={<CreateForm />} />
            <Route path="/form/:formId/fill" element={<FillForm />} />
            <Route path="/form/:formId/settings" element={<FormSetting />} />
            <Route path="/form/:formId/responses" element={<Responses />} />
            <Route path="/forms" element={<MyForms />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/superadmin" element={<SuperAdmin />} />
          </Routes>
        </BrowserRouter>
      </DrawingProvider>
    </AuthProvider>
  );
}

export default App;
