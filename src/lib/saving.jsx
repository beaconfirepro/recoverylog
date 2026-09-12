import { ToastAction } from "@/components/ui/toast";
import { toast } from "@/components/ui/use-toast";
import { announce } from "@/lib/announce";
import { buzz, deletedNote, failedNote, savedNote } from "@/lib/saveNotes";

// The single way a write in this app reports itself: a buzz and a brief toast
// when it lands, and when it does not, a toast that says what went wrong and
// offers Retry. Both are spoken as well as shown — see the note on the live
// region below.
//
// It deliberately does not put the screen back. Only the caller knows whether
// that means holding a dialog open, restoring a list, or leaving the old value
// where it was. What this guarantees is that the caller finds out at all, which
// is what no write here did before.
//
// Options: what (a noun phrase that can be the subject of "didn't save"),
// saved/deleted (the success sentence, when the default reads wrong), title and
// advice (the failure headline and what to do about it), retry (what the Retry
// button calls), quiet (no toast and no buzz on success — for a write that
// already confirms itself on the page; the announcement still happens, because
// a screen reader cannot see that confirmation).
async function attempt(write, note, opts) {
  try {
    const value = await write();
    if (opts.quiet) {
      // No toast, so the live region is the only place this is said at all.
      announce(`${note.title}. ${note.description}`);
    } else {
      buzz();
      // A toast announces its own text as it appears, so writing the same
      // sentence into Layout's live region as well would say everything twice.
      // What the region is for is what no toast covers: the log switch, and a
      // success like the PDF that confirms itself on the page.
      //
      // type "background" is what makes a save wait its turn instead of cutting
      // in; the failure below keeps the default and interrupts, which is the
      // whole difference between the two. Short, because it is a confirmation
      // rather than something to read.
      toast({ ...note, type: "background", duration: 2500 });
    }
    return { ok: true, value };
  } catch (err) {
    toast({
      ...failedNote(opts.what, err, opts),
      // Long enough to reach Retry one-handed and sore, which is the state the
      // person reading it is in.
      duration: 12000,
      action: opts.retry ? (
        <ToastAction altText="Retry" onClick={() => opts.retry()}>
          Retry
        </ToastAction>
      ) : undefined
    });
    return { ok: false, error: err };
  }
}

export const save = (write, opts = {}) => attempt(write, savedNote(opts.what, opts.saved), opts);

// A deletion that fails leaves the row exactly where it was, so it says that
// rather than "didn't save".
export const remove = (write, opts = {}) =>
  attempt(write, deletedNote(opts.what, opts.deleted), {
    title: `${opts.what} is still here`,
    advice: "Tap Retry to delete it again.",
    ...opts
  });
