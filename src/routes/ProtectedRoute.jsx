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

  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const role = getNormalizedRole(user);

  if (!token) {

    return <Navigate to="/login" replace />;

  }

  if (allowedRoles.length > 0 && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/403" replace />;
  }

  return children;

}

export default ProtectedRoute;