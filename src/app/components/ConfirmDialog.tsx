import React, { useEffect } from "react";

type Props = {
    open: boolean;
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
    danger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

export default function ConfirmDialog({
    open,
    title = "Confirmar ação",
    description = "Tem certeza que deseja continuar?",
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    loading = false,
    danger = false,
    onConfirm,
    onCancel,
    }: Props) {
    // ESC fecha
    useEffect(() => {
        if (!open) return;

        function onKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape") onCancel();
        }

        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* overlay */}
            <button
                aria-label="Fechar"
                onClick={onCancel}
                className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            />

        {/* modal */}
            <div className="relative w-full max-w-md mx-4 rounded-2xl border border-gray-200/20 dark:border-[#3b4354]/60 bg-white dark:bg-[#0f1624] shadow-xl">
                <div className="p-6">
                <div className="flex items-start gap-3">
                    {/* ícone */}
                    <div
                    className={`mt-1 flex h-10 w-10 items-center justify-center rounded-xl ${
                        danger
                        ? "bg-red-500/10 text-red-500"
                        : "bg-primary/10 text-primary"
                    }`}
                    >
                    <span className="material-symbols-outlined">
                        {danger ? "warning" : "info"}
                    </span>
                    </div>

                    <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        {description}
                    </p>
                    </div>

                    {/* close */}
                    <button
                    onClick={onCancel}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                    aria-label="Fechar modal"
                    >
                    <span className="material-symbols-outlined text-[20px]">
                        close
                    </span>
                    </button>
                </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg border border-gray-200 dark:border-[#3b4354]/70 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition disabled:opacity-50"
                        >
                        {cancelText}
                        </button>

                        <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg text-white transition disabled:opacity-50 ${
                            danger
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-primary hover:bg-primary/90"
                        }`}
                        >
                        {loading ? "Processando..." : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
