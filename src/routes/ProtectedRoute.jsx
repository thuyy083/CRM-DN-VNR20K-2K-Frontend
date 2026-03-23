import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const getNormalizedRole = (user) => {
  const directRole = user?.role || user?.roleName;
  if (typeof directRole === "string" && directRole.trim()) {
    return directRole.trim().toUpperCase();
  }

  const firstRole = user?.roles?.[0];
  if (typeof firstRole === "string" && firstRole.trim()) {
    return firstRole.trim().toUpperCase();
  }
  if (firstRole?.name && typeof firstRole.name === "string") {
    return firstRole.name.trim().toUpperCase();
  }

  return "";
};

function ProtectedRoute({ children, allowedRoles = [] }) {
  // Lấy thêm isLoading nếu trong Redux auth slice của bạn có state này
  const { token, user, isLoading } = useSelector((state) => state.auth);
  const role = getNormalizedRole(user);

  // 1. NẾU REDUX CÓ STATE ISLOADING -> Đợi load xong
  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "50px" }}>
        Đang tải thông tin...
      </div>
    );
  }

  // 2. NẾU BẠN KHÔNG CÓ ISLOADING TRONG REDUX -> Dùng mẹo check token & user
  // Có token nhưng chưa có user -> Hệ thống đang gọi API lấy user -> Phải đợi
  if (token && !user) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "50px" }}>
        Đang xác thực quyền truy cập...
      </div>
    );
  }

  // 3. Không có token -> Chưa đăng nhập -> Về thẳng Login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 4. Có token, ĐÃ CÓ user -> Bắt đầu check Role
  if (allowedRoles.length > 0 && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/403" replace />;
  }

  // 5. Vượt qua mọi bài kiểm tra -> Cho phép vào trang
  return children;
}

export default ProtectedRoute;