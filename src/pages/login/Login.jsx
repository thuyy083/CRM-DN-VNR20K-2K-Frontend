import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../../redux/slices/authSlice";
import logo from "../../assets/images/logo.png";
import "./Login.scss";

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
    console.log('form: ', form)
  };

    const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login(form));
    if (result.payload?.data?.accessToken) {
        localStorage.setItem("token", result.payload.data.accessToken);
        navigate("/");
    }
    };


  return (
    <div className="login-page">

      <div className="login-container">

        <div className="login-logo">
          <img src={logo} alt="viettel logo" />
        </div>

        <h2>CRM Login</h2>

        <form onSubmit={handleSubmit}>

          <div className="input-group">
            <input
              type="text"
              name="username"
              placeholder="Email"
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
            />
          </div>

          <button type="submit">
            Đăng nhập
          </button>

        </form>

      </div>

    </div>
  );
}

export default Login;