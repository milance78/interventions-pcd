import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Settings } from "lucide-react";

import "./ProfileMenu.scss";
import { auth } from "../../firebase/firebaseConfig";
import { getUserProfile } from "../../firebase/userService";
import LoginPage from "../../pages/loginPage/LoginPage";

const ProfileMenu = () => {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [openPanel, setOpenPanel] = useState<"profile" | "settings" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);

        if (!currentUser) {
          setUsername("");
          return;
        }

        void getUserProfile(currentUser.uid)
          .then((profile) => {
            setUsername(
              profile?.username?.trim() ||
                currentUser.displayName?.trim() ||
                currentUser.email?.split("@")[0] ||
                "",
            );
          })
          .catch(() => {
            setUsername(
              currentUser.displayName?.trim() ||
                currentUser.email?.split("@")[0] ||
                "",
            );
          });
      }),
    [],
  );

  useEffect(() => {
    const closeMenuWhenClickingOutside = (event: MouseEvent) => {
      const clickedElement = event.target as Node;

      if (
        containerRef.current &&
        !containerRef.current.contains(clickedElement)
      ) {
        setOpenPanel(null);
      }
    };

    document.addEventListener("mousedown", closeMenuWhenClickingOutside);
    return () =>
      document.removeEventListener("mousedown", closeMenuWhenClickingOutside);
  }, []);

  const displayName =
    username || user?.displayName || user?.email?.split("@")[0] || "";
  const avatarText = displayName ? displayName.charAt(0).toUpperCase() : "👤";

  const toggleMenu = (_event: ReactMouseEvent<HTMLButtonElement>) => {
    setOpenPanel((currentValue) =>
      currentValue === "profile" ? null : "profile",
    );
  };

  const toggleSettings = () => {
    setOpenPanel((currentValue) =>
      currentValue === "settings" ? null : "settings",
    );
  };

  return (
    <div className="profile-menu" ref={containerRef}>
      <div className="profile-menu__actions">
        <button
          type="button"
          className="profile-menu__trigger"
          onClick={toggleMenu}
          aria-expanded={openPanel === "profile"}
          aria-label="Ouvrir le profil utilisateur"
        >
          <span className="profile-menu__label">
            {user ? displayName : "Non connecté"}
          </span>
          <span className="profile-menu__avatar">{avatarText}</span>
        </button>
        <button
          type="button"
          className="profile-menu__settings-button"
          onClick={toggleSettings}
          aria-expanded={openPanel === "settings"}
          aria-label="Paramètres"
          title="Paramètres"
        >
          <Settings size={18} strokeWidth={2} />
        </button>
      </div>

      {openPanel && (
        <div className="profile-menu__popup">
          <LoginPage
            profileDisplayName={displayName}
            menuMode={openPanel}
          />
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
