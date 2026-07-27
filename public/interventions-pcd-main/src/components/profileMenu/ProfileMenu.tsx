import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";

import "./ProfileMenu.scss";
import { auth } from "../../firebase/firebaseConfig";
import LoginPage from "../../pages/loginPage/LoginPage";

const ProfileMenu = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

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

  const displayName = user?.displayName || user?.email?.split("@")[0] || "";
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
      >
        <span className="profile-menu__label">
          {user ? `Profil : ${displayName}` : "Non connecté"}
        </span>
        <span className="profile-menu__avatar">{avatarText}</span>
      </button>

      {isOpen && (
        <div className="profile-menu__popup">
          <LoginPage />
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
