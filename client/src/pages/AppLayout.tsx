import { Outlet } from "react-router-dom"
import Banner from "../components/Banner"
import Navbar from "../components/Navbar"


const AppLayout = () => {
  return (
    <>
      <Banner/>
     <Navbar/>
      <main className="min-h-screen">
        <Outlet/>
      </main>

      <div>footer</div>
      <div>cartside bar</div>
    </>
  )
}

export default AppLayout