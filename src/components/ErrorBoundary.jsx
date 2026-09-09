import React from "react";

// A recovery log that shows a blank page is worse than one that admits it
// broke: there is no way to tell a crash from a bad connection, and no way
// out of it. Anything that throws lands here instead.
export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("LipNode crashed:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="nb-card overflow-hidden">
          <div className="px-4 py-3 border-b-2 bg-destructive text-destructive-foreground">
            <div className="font-display text-xl uppercase leading-tight break-words">Something went wrong</div>
            <div className="text-sm font-semibold break-words">Nothing you logged has been lost.</div>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-sm font-semibold break-words">
              The screen failed to load. Reloading usually fixes it. If it keeps happening, sign out and back in.
            </p>
            <p className="text-[11px] font-mono break-words text-muted-foreground">
              {String(this.state.error?.message || this.state.error)}
            </p>
            <button className="nb-btn w-full h-14 bg-primary text-primary-foreground" onClick={() => window.location.reload()}>
              Reload
            </button>
            <button
              className="nb-btn w-full h-12 bg-card"
              onClick={() => {
                try {
                  window.localStorage.removeItem("base44_access_token");
                  window.localStorage.removeItem("token");
                } catch {
                  // A browser refusing storage still gets sent to the login screen.
                }
                window.location.href = `${window.location.origin}/login`;
              }}
            >
              Sign out and start again
            </button>
          </div>
        </div>
      </div>
    );
  }
}
