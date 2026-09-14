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

// Two looks over one parser.
//
// "plain" is the legal documents: headings are quiet labels and everything else
// is prose, because a privacy policy read at the consent gate is a serious
// moment and should not be decorated.
//
// "faq" is the help pages, which are genuinely question-and-answer and read
// better when that shape is visible — a pink section banner, the question in
// bold, the answer set off like a quotation so the eye can skip the answers it
// does not need and land on the question it does.
//
// Borders take the theme's own border colour rather than a literal black: it is
// near-black in the light scheme, and a black border on a dark background is an
// invisible one.
const LOOKS = {
  plain: {
    heading: "font-heading text-xs uppercase tracking-wider text-muted-foreground pt-1.5",
    question: "font-heading text-sm pt-2 break-words",
    answer: "text-sm leading-relaxed break-words"
  },
  faq: {
    heading:
      "font-display text-sm uppercase tracking-wider border-2 rounded-xl px-3 py-2 mt-4 break-words " +
      "bg-primary text-primary-foreground",
    question: "text-sm font-bold pt-2 break-words",
    answer: "text-sm leading-relaxed break-words border-l-4 pl-3 text-muted-foreground"
  }
};

export default function DocReader({ body, look = "plain" }) {
  const style = LOOKS[look] || LOOKS.plain;
  const lines = String(body || "")
    .split(/\n{2,}/)
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="space-y-2.5">
      {lines.map((line, i) =>
        isHeading(line) ? (
          <h3 key={i} className={style.heading}>
            {line.replace(/:$/, "")}
          </h3>
        ) : isQuestion(line) ? (
          <h4 key={i} className={style.question}>
            {line}
          </h4>
        ) : (
          <p key={i} className={style.answer}>
            {line}
          </p>
        )
      )}
    </div>
  );
}
