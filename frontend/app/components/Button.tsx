import React from "react";
import styles from "./Button.module.css";

interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant: "start" | "stop";
}

const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  disabled,
  variant,
}) => {
  return (
    <button
      className={`${styles.button} ${
        variant === "start" ? styles.start : styles.stop
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
};

export default Button;
