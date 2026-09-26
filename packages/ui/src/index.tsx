import React from "react";

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  ...props
}) => (
  <button
    {...props}
    style={{
      padding: "0.5rem 1rem",
      borderRadius: 6,
      border: "1px solid #ccc",
      background: "#111",
      color: "#fff",
      cursor: "pointer",
    }}
  >
    {children}
  </button>
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => (
    <input
      ref={ref}
      {...props}
      style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc", width: "100%" }}
    />
  ),
);
Input.displayName = "Input";
