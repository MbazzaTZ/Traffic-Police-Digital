import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { AppDataProvider } from "./context/AppDataContext";
import InstallPrompt from "./components/mobile/InstallPrompt";

function App() {
  return (
    <AppDataProvider>
      <BrowserRouter>
        <AppRoutes />
        <InstallPrompt />
      </BrowserRouter>
    </AppDataProvider>
  );
}

export default App;
