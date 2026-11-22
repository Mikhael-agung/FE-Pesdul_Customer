import type { InputHTMLAttributes } from "react";

export default function Field(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} />;
}
