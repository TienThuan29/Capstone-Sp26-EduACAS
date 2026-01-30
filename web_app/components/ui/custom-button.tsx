import { Button } from "flowbite-react";
import type { ButtonProps } from "flowbite-react";
import type { ReactNode } from "react";

type CustomButtonProps = ButtonProps & {
  label: string;
  icon?: ReactNode;
};

export const DefaultCustomButton = ({
  label,
  icon,
  onClick,
  className,
  ...rest
}: CustomButtonProps) => {
  return (
    <Button
      className={`inline-flex cursor-pointer items-center gap-2 bg-[#1F4E79] text-white hover:bg-[#1F4E79]/90 ${className ?? ""}`}
      onClick={onClick}
      {...rest}
    >
      {icon}
      {label}
    </Button>
  );
};

export const DefaultOutlineCustomButton = ({
  label,
  icon,
  onClick,
  className,
  ...rest
}: CustomButtonProps) => {
  return (
    <Button
      color="light"
      onClick={onClick}
      {...rest}
      className={`group inline-flex w-fit cursor-pointer items-center gap-2 border border-gray-200 px-6 py-2.5 text-sm font-bold text-[#1F4E79] hover:border-[#1F4E79] hover:bg-[#1F4E79] hover:text-white dark:border-gray-700 dark:bg-gray-800 dark:text-[#C9A24D] dark:hover:border-[#C9A24D] dark:hover:bg-[#C9A24D] dark:hover:text-gray-900 ${className ?? ""}`}
    >
      {icon}
      {label}
    </Button>
  );
};
