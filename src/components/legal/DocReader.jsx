import React from "react";

// A document body is plain text. A line typed in capitals and ending in a
// colon is its own heading; everything else is a paragraph. That is the whole
// format, which is what keeps the text editable by someone who is not editing
// this app.
const isHeading = (line) => /:$/.test(line) && line === line.toUpperCase() && /[A-Z]/.test(line);

export default function DocReader({ body }) {
  const lines = String(body || "")
    .split(/\n{2,}/)
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="space-y-2.5">
      {lines.map((line, i) =>
        isHeading(line) ? (
          <h3 key={i} className="font-heading text-xs uppercase tracking-wider text-muted-foreground pt-1.5">
            {line.replace(/:$/, "")}
          </h3>
        ) : (
          <p key={i} className="text-sm leading-relaxed break-words">
            {line}
          </p>
        )
      )}
    </div>
  );
}
