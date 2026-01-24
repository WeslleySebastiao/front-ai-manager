declare module "react-syntax-highlighter/dist/esm/styles/prism" {
  export const oneDark: any;
  export const oneLight: any;
}

declare module "react-syntax-highlighter" {
  import * as React from "react";

  export interface SyntaxHighlighterProps {
    language?: string;
    style?: any;
    children?: string | string[];
    PreTag?: React.ElementType;
    CodeTag?: React.ElementType;
    customStyle?: React.CSSProperties;
    codeTagProps?: React.HTMLAttributes<HTMLElement>;
    wrapLongLines?: boolean;
    showLineNumbers?: boolean;
    lineNumberStyle?: React.CSSProperties;
    startingLineNumber?: number;
  }

  export const Prism: React.ComponentType<SyntaxHighlighterProps>;
  const SyntaxHighlighter: React.ComponentType<SyntaxHighlighterProps>;
  export default SyntaxHighlighter;
}
