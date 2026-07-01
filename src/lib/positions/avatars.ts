// Map a position-holder name to a stable real avatar photo from the design-system pool.
import avatars from "@/assets/avatars";

const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
export const avatarFor = (name: string): string => avatars[hash(name) % avatars.length];
