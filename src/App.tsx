import useReactRouter from "./routes/router";
import "./App.css";
import "./index.css";
import { ToastContainer } from "react-toastify";

export default function App() {
  const element = useReactRouter();
  return (
    <>
      <div>{element}</div>
      <ToastContainer />
    </>
  );
}
