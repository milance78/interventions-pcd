import * as React from "react";
import {
  subscribeToAuthChanges,
  loginUser,
  registerUser,
  logoutUser,
  resetPassword,
} from "../../firebase/auth";
import { createUserProfile } from "../../firebase/userService";
import { EyeOff } from "lucide-react";
import { Eye } from "lucide-react";
import "./LoginPage.scss";
const LoginPage = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [user, setUser] = React.useState(null);
  const [isRegister, setIsRegister] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  React.useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);
  const handleLogin = async () => {
    try {
      await loginUser(email, password);
    } catch (error) {
      alert(error.message);
    }
  };
  const handleRegister = async () => {
    try {
      const registeredUser = await registerUser(email, password);
      await createUserProfile(registeredUser.uid, username, email);
    } catch (error) {
      alert(error.message);
    }
  };
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      alert(error.message);
    }
  };
  const handleForgotPassword = async () => {
    if (!email) {
      alert("Enter your email first");
      return;
    }
    try {
      await resetPassword(email);
      alert("Password reset email sent");
    } catch (error) {
      alert(error.message);
    }
  };
  if (user) {
    return (
      <div className="login-page">
        <div className="login-page__card">
          <h2>{"Welcome"}</h2>
          <p>{user.email}</p>
          <button onClick={handleLogout}>{"Logout"}</button>
        </div>
      </div>
    );
  }
  return (
    <div className="login-page">
      <div className="login-page__card">
        <h2>{isRegister ? "Create account" : "Login"}</h2>
        {isRegister && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            type="button"
            className="eye-button"
            onClick={() => setShowPassword((currentValue) => !currentValue)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>
        {isRegister ? (
          <button onClick={handleRegister}>{"Create account"}</button>
        ) : (
          <button onClick={handleLogin}>{"Login"}</button>
        )}
        {!isRegister && (
          <button
            type="button"
            className="link-button"
            onClick={handleForgotPassword}
          >
            {"Forgot password?"}
          </button>
        )}
        <button
          type="button"
          className="secondary-button"
          onClick={() => setIsRegister((currentValue) => !currentValue)}
        >
          {isRegister ? "Already have account?" : "Create new account"}
        </button>
      </div>
    </div>
  );
};
export default LoginPage;
