import { Outlet } from "react-router-dom";
import Sidebar from "../../components/sidebar/Sidebar";
import Header from "../../components/header/Header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./MainLayout.module.scss";

function MainLayout() {
  return (
    <div className={styles.mainLayout}>
      <Sidebar />

      <div className={styles.mainContent}>
        <Header />

        <div className={styles.pageContent}>
          <Outlet />
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={true}
        closeButton={false}
        newestOnTop
        theme="colored"
      />
    </div>
  );
}

export default MainLayout;