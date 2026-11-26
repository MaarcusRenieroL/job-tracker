import { useEffect, useRef } from "react";
import { RichTextEditor } from "@editorcn/editor";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import "@editorcn/editor/style.css";

function textDocument(text: string) {
  return {
    type: "doc",
    content: text.split("\n").map((line) => ({
      type: "paragraph",
      ...(line ? { content: [{ type: "text", text: line }] } : {}),
    })),
  };
}

export function RichTextInput({
  label,
  text,
  html,
  onChange,
  placeholder,
}: {
  label: string;
  text: string;
  html?: string;
  onChange: (text: string, html: string) => void;
  placeholder?: string;
}) {
  const changeRef = useRef(onChange);
  changeRef.current = onChange;
  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: placeholder ?? "Start typing…" })],
    content: html || textDocument(text),
    editorProps: {
      attributes: {
        "aria-label": label,
        class: "min-h-40 max-h-64 overflow-y-auto px-3 py-3 text-sm outline-none",
      },
    },
    onUpdate: ({ editor: current }) => changeRef.current(current.getText({ blockSeparator: "\n" }), current.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getText({ blockSeparator: "\n" }) !== text) {
      editor.commands.setContent(html || textDocument(text), { emitUpdate: false });
    }
  }, [editor, text, html]);

  return (
    <RichTextEditor editor={editor} className="overflow-hidden rounded-lg border border-input bg-background">
      <RichTextEditor.Toolbar>
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Bold /><RichTextEditor.Italic /><RichTextEditor.Strikethrough />
        </RichTextEditor.ControlsGroup>
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.BulletList /><RichTextEditor.OrderedList />
        </RichTextEditor.ControlsGroup>
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Undo /><RichTextEditor.Redo />
        </RichTextEditor.ControlsGroup>
      </RichTextEditor.Toolbar>
      <RichTextEditor.Content />
    </RichTextEditor>
  );
}
