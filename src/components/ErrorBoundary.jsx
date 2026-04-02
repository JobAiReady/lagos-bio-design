import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(_error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    handleRecover = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div role="alert" className="min-h-screen bg-slate-950 text-red-500 p-8 font-mono flex flex-col items-center justify-center">
                    <h1 className="text-3xl font-bold mb-2">Something went wrong</h1>
                    <p className="text-slate-400 mb-6 text-sm text-center max-w-md">An unexpected error occurred. You can try recovering or return to the home page.</p>
                    <div className="bg-slate-900 p-4 rounded border border-red-900 overflow-auto max-w-2xl w-full mb-6">
                        <p className="font-bold text-sm">{this.state.error && this.state.error.toString()}</p>
                        <pre className="text-xs mt-2 text-slate-500 whitespace-pre-wrap">
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={this.handleRecover}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-all"
                        >
                            Try to Recover
                        </button>
                        <a
                            href="/"
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-all"
                        >
                            Back to Home
                        </a>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
