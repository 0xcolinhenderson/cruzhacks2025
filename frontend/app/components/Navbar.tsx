import React from "react";
import Link from "next/link";
import styles from "./Navbar.module.css";

interface Route {
  name: string;
  path: string;
  isMain?: boolean;
}

interface NavbarProps {
  routes: Route[];
}

const Navbar: React.FC<NavbarProps> = ({ routes }) => {
  return (
    <nav className={styles.navbar}>
      <ul className={styles.navList}>
        {routes.map((route, index) => (
          <li key={index} className={styles.navItem}>
            <Link
              href={route.path}
              className={
                route.isMain
                  ? `${styles.navLink} ${styles.mainNavLink}`
                  : styles.navLink
              }
            >
              {route.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navbar;
