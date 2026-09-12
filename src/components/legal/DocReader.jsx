import React from "react";

// A document body is plain text. A line typed in capitals and ending in a
// colon is a section heading; a short line on its own ending in a question mark
// is a question; everything else is a paragraph. That is the whole format,
// which is what keeps the text editable by someone who is not editing this app.
//
// The question rule is what lets the help pages use the same reader as the
// legal documents rather than a second one. It is deliberately narrow: a
// paragraph that happens to end in a question mark is still a paragraph,
// because a real question is one line and short.
const isHeading = (line) => /:$/.test(line) && line === line.toUpperCase() && /[A-Z]/.test(line);

const QUESTION_MAX = 120;
const isQuestion = (line) => /\?$/.test(line) && line.length <= QUESTION_MAX && !line.includes("\n");

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
        ) : isQuestion(line) ? (
          <h4 key={i} className="font-heading text-sm pt-2 break-words">
            {line}
          </h4>
        ) : (
          <p key={i} className="text-sm leading-relaxed break-words">
            {line}
          </p>
        )
      )}
    </div>
  );
}
