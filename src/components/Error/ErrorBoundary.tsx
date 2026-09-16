"use client";

import React from "react";

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Відправляємо помилку на наш API
        fetch("/api/admin/logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: error.message,
                stack: errorInfo.componentStack || error.stack,
                source: `Client Page: ${window.location.pathname}`,
            }),
        }).catch(() => {});
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 m-4 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
                    <h2 className="text-lg font-bold text-red-700">Ой! Щось пішло не так 🙁</h2>
                    <p className="text-xs text-red-600">
                        Ми вже зафіксували цю помилку та працюємо над її усуненням. Спробуйте оновити сторінку.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition"
                    >
                        Оновити сторінку
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}