import { useSelector } from "react-redux";
import "./Profile.scss";

function Profile() {

  const user = useSelector((state) => state.auth.user);

  return (
    <div className="profile-page">

      <div className="profile-card">

        <div className="profile-header">

          <div className="avatar-profile">
            {user?.fullName?.charAt(0)}
          </div>

          <div className="profile-name">
            <h2>{user?.fullName}</h2>
            <span className="role-badge">{user?.role}</span>
          </div>

        </div>

        <div className="profile-body">

          <div className="info-item">
            <label>Email</label>
            <span>{user?.email}</span>
          </div>

          <div className="info-item">
            <label>Số điện thoại</label>
            <span>{user?.phone || "Chưa cập nhật"}</span>
          </div>

          <div className="info-item">
            <label>Giới tính</label>
            <span>{user?.gender || "Chưa cập nhật"}</span>
          </div>

          <div className="info-item">
            <label>Ngày sinh</label>
            <span>{user?.dateOfBirth || "Chưa cập nhật"}</span>
          </div>

          <div className="info-item">
            <label>Trạng thái</label>
            <span className="status">{user?.status}</span>
          </div>

          <div className="info-item">
            <label>Ngày tạo</label>
            <span>{user?.createdAt}</span>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Profile;