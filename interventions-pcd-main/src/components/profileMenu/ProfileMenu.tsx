import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";

import "./ProfileMenu.scss";
import { auth } from "../../firebase/firebaseConfig";
import { getUserProfile } from "../../firebase/userService";
import LoginPage from "../../pages/loginPage/LoginPage";

const ProfileMenu = () => {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [isOpen, setIsOpen] = useState(false);
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
        setIsOpen(false);
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
    setIsOpen((currentValue) => !currentValue);
  };

  return (
    <div className="profile-menu" ref={containerRef}>
      <button
        type="button"
        className="profile-menu__trigger"
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-label="Ouvrir le profil utilisateur"
      >
        <span className="profile-menu__label">
          {user ? displayName : "Non connecté"}
        </span>
        <span className="profile-menu__avatar">{avatarText}</span>
      </button>

      {isOpen && (
        <div className="profile-menu__popup">
          <LoginPage profileDisplayName={displayName} />
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
