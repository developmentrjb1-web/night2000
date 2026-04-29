import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MessengerButton from "@/components/MessengerButton";

export default function Layout() {
  return (
    <div className="App relative">
      <Navbar />
      <main className="pt-20">
        <Outlet />
      </main>
      <Footer />
      <MessengerButton />
    </div>
  );
}
