import { Outlet } from "react-router-dom"
import Banner from "../components/Banner"


const AppLayout = () => {
  return (
    <>
      <Banner/>
      <div>nabvar</div>
      <main className="min-h-screen">
        <Outlet/>
      </main>

      <div>footer</div>
      <div>cartside bar</div>
    </>
  )
}

export default AppLayout