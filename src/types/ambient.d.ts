// Ambient type definitions to ensure clean local IDE resolution
import React from "react";

declare module "next/link" {
  export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    as?: string;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
    prefetch?: boolean;
    locale?: string | false;
    children?: React.ReactNode;
  }
  const Link: React.ForwardRefExoticComponent<LinkProps & React.RefAttributes<HTMLAnchorElement>>;
  export default Link;
}

declare module "next/navigation" {
  export function useRouter(): {
    push(href: string, options?: any): void;
    replace(href: string, options?: any): void;
    refresh(): void;
    back(): void;
    forward(): void;
    prefetch(href: string): void;
  };
  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
  export function useParams<T = Record<string, string | string[]>>(): T;
}

declare module "next-auth/react" {
  export function useSession(): { data: any; status: "authenticated" | "loading" | "unauthenticated" };
  export function signIn(provider?: string, options?: any): Promise<any>;
  export function signOut(options?: any): Promise<any>;
  export const SessionProvider: any;
}
