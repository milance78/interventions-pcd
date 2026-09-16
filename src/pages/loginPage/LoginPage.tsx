import * as React from "react";
import {
  subscribeToAuthChanges,
  loginUser,
  registerUser,
  logoutUser,
  resetPassword,
} from "../../firebase/auth";
import { createUserProfile } from "../../firebase/userService";
import {
  deleteAccountAndData,
  reauthenticateWithPassword,
  revokeAllApplicationSessions,
} from "../../security/firebaseSecurity";
import { EyeOff } from "lucide-react";
import { Eye } from "lucide-react";
import "./LoginPage.scss";
type LoginPageProps = {
  profileDisplayName?: string;
  menuMode?: "profile" | "settings";
};

const LoginPage = ({ profileDisplayName = "", menuMode = "profile" }: LoginPageProps) => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [user, setUser] = React.useState(null);
  const [isRegister, setIsRegister] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = React.useState(false);
  const [deletePassword, setDeletePassword] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);
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
  const handleLogoutAllDevices = async () => {
    if (!user) return;
    try {
      await revokeAllApplicationSessions(user.uid);
      await handleLogout();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to revoke sessions");
    }
  };
  const handleDeleteAccount = async () => {
    if (!deletePassword || isDeleting) return;
    setIsDeleting(true);
    try {
      await reauthenticateWithPassword(deletePassword);
      await deleteAccountAndData();
      alert("Le compte et toutes ses données ont été supprimés.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "La suppression a échoué.");
    } finally {
      setIsDeleting(false);
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
          <h2 className="login-page__welcome">Bienvenu</h2>
          <p className="login-page__username">
            {profileDisplayName || user.displayName || user.email?.split("@")[0]}
          </p>
          {menuMode === "profile" && (
            <button onClick={handleLogout}>Déconnexion</button>
          )}

          {menuMode === "settings" && (
            <>
              <button
                type="button"
                onClick={() => setShowRevokeDialog(true)}
              >
                Déconnecter tous les appareils
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteDialog(true)}
                className="danger-button"
              >
                Supprimer définitivement le compte
              </button>
            </>
          )}
        </div>

        {showRevokeDialog && (
          <div
            className="account-action-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="revoke-sessions-title"
          >
            <div className="account-action-dialog__panel">
              <div className="account-action-dialog__icon" aria-hidden="true">↻</div>
              <h3 id="revoke-sessions-title">Déconnecter tous les appareils</h3>
              <p>
                Cette action déconnectera votre compte de tous les appareils.
                Vous pourrez vous reconnecter ensuite.
              </p>
              <div className="account-action-dialog__actions">
                <button
                  className="account-action-dialog__confirm"
                  type="button"
                  onClick={async () => {
                    setShowRevokeDialog(false);
                    await handleLogoutAllDevices();
                  }}
                >
                  Confirmer la déconnexion
                </button>
                <button
                  className="account-action-dialog__cancel"
                  type="button"
                  onClick={() => setShowRevokeDialog(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteDialog && (
          <div className="account-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="account-delete-title">
            <div className="account-delete-dialog__panel">
              <div className="account-delete-dialog__icon" aria-hidden="true">⚠</div>
              <h3 id="account-delete-title">Supprimer définitivement le compte</h3>
              <p>Cette action supprime toutes les données Firebase et le compte. Elle est irréversible.</p>
            <input
              type="password"
              placeholder="Mot de passe"
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
              autoFocus
            />
              <div className="account-delete-dialog__actions">
                <button className="account-delete-dialog__confirm" type="button" disabled={isDeleting || !deletePassword} onClick={handleDeleteAccount}>
                  {isDeleting ? "Suppression…" : "Confirmer la suppression"}
                </button>
                <button className="account-delete-dialog__cancel" type="button" disabled={isDeleting} onClick={() => { setShowDeleteDialog(false); setDeletePassword(""); }}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
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
