import React from "react";
import Link from "next/link";
import styles from "./Navbar.module.css";

interface Route {
  name: string;
  path: string;
  isMain?: boolean;
  icon?: string;
}

interface NavbarProps {
  routes: Route[];
}

export default function Navbar({ routes }: NavbarProps) {
  return (
    <div className={styles.navbarContainer}>
      <div className={styles.topRightText}>Verity</div>
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
                {route.icon && (
                  <img
                    src={route.icon}
                    alt={`${route.name} icon`}
                    className={styles.navIcon}
                  />
                )}
                {route.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
