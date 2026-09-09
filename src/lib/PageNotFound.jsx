import { useLocation } from "react-router-dom";

// A wrong URL is not an error the person made. It says where everything is and
// gets out of the way.
export default function PageNotFound() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
      <div className="max-w-lg w-full nb-card overflow-hidden">
        <div className="px-4 py-3 border-b-2 bg-muted">
          <div className="font-display text-xl uppercase leading-tight break-words">That page isn't here</div>
          <div className="text-sm font-semibold break-words">
            Nothing is at <span className="font-mono">{pathname}</span>.
          </div>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-sm font-semibold break-words">
            The link may be out of date. Everything lives under the tabs at the bottom of the app.
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            className="nb-btn w-full h-14 bg-primary text-primary-foreground"
          >
            Go to today
          </button>
        </div>
      </div>
    </div>
  );
}
