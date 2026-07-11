"use client";

import { trackMetaEvent } from "@/lib/tracking";

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  phone?: string;
  display?: string;
  contentName?: string;
  children: React.ReactNode;
};

export function PhoneLink({
  phone = "02071774141",
  display = "020 7177 4141",
  contentName = "Phone Click",
  children,
  onClick,
  ...props
}: Props) {
  return (
    <a
      href={`tel:${phone}`}
      onClick={(e) => {
        trackMetaEvent("Contact", { content_name: contentName, phone: display });
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </a>
  );
}
