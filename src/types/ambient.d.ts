// Global ambient declarations for local IDE resolution
declare var process: {
  env: Record<string, string | undefined>;
};

declare module "next/link" {
  const Link: any;
  export default Link;
}

declare module "next/navigation" {
  export const useRouter: any;
  export const usePathname: any;
  export const useSearchParams: any;
  export const useParams: any;
  export const redirect: any;
}

declare module "next-auth/react" {
  export const useSession: any;
  export const signIn: any;
  export const signOut: any;
  export const SessionProvider: any;
  export const getSession: any;
}
