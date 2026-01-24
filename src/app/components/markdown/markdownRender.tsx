import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Temas Prism (um pra light e um pra dark)
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";


type Props = {
  content: string;
  // opcional: força tema, se você quiser usar isso em algum lugar específico
  forceTheme?: "light" | "dark";
};

function useIsDark(forceTheme?: "light" | "dark") {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    if (forceTheme) {
      setIsDark(forceTheme === "dark");
      return;
    }

    // padrão do projeto: class "dark" no <html>
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));

    update();

    // observa mudanças de classe no <html>
    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, [forceTheme]);

  return isDark;
}

export default function MarkdownRenderer({ content, forceTheme }: Props) {
  const isDark = useIsDark(forceTheme);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h3: ({ children }) => (
          <h3 className="mt-3 mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {children}
          </p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-gray-900 dark:text-gray-100">
            {children}
          </strong>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>
        ),
        li: ({ children }) => (
          <li className="text-sm text-gray-700 dark:text-gray-300">
            {children}
          </li>
        ),

        // ✅ INLINE + CODE BLOCK com syntax highlight
        code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const language = match?.[1];

            const raw = String(children ?? "");
            const codeText = raw.replace(/\n$/, "");

            // ✅ heurística: se tem linguagem, é bloco. Se tem \n, geralmente é bloco também.
            const isBlock = Boolean(language) || codeText.includes("\n");

            if (!isBlock) {
                return (
                <code
                    className="font-mono text-[12px] px-1 py-0.5 rounded
                            bg-black/5 dark:bg-white/10
                            text-gray-900 dark:text-gray-100"
                    {...(props as any)}
                >
                    {children}
                </code>
                );
            }

            return (
                <div className="my-2 max-w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-white/10">
                <SyntaxHighlighter
                    language={language ?? "text"}
                    style={isDark ? oneDark : oneLight}
                    PreTag="div"
                    customStyle={{
                    margin: 0,
                    background: "transparent", // não muda o fundo
                    padding: "12px",
                    fontSize: "12px",
                    }}
                    codeTagProps={{
                    style: {
                        fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    },
                    }}
                >
                    {codeText}
                </SyntaxHighlighter>
                </div>
            );
            },

      }}
    >
      {content}
    </ReactMarkdown>
  );
}
