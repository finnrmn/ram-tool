declare module "react-katex" {
  import type { FC, ReactNode } from "react";

  type MathProps = {
    math?: string;
    children?: ReactNode;
    errorColor?: string;
    renderError?: (error: Error) => ReactNode;
  };

  export const BlockMath: FC<MathProps>;
  export const InlineMath: FC<MathProps>;
}
