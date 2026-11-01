/// <reference types="vite/client" />

declare module "*.png" {
  const imageUrl: string;
  export default imageUrl;
}

declare module "*.png?no-inline" {
  const imageUrl: string;
  export default imageUrl;
}

declare module "*.css";
