declare module "#auth-utils" {
  interface User {
    kind: "merchant" | "operator";
    id: string;
    email: string;
    name?: string;
  }
}

export {};
