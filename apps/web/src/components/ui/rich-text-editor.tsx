import { useEffect } from "react";
import { Link, RichTextEditor } from "@editorcn/editor";
import { Highlight } from "@tiptap/extension-highlight";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { TableKit } from "@tiptap/extension-table";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { ListTodo, Table2 } from "lucide-react";
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

// Field-sized adaptation of the editorcn Simple Document Editor.
export function RichTextInput({
  id,
  label,
  text,
  html,
  onChange,
  placeholder,
}: {
  id?: string;
  label: string;
  text: string;
  html?: string;
  onChange: (text: string, html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    content: html || textDocument(text),
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false }),
      Link,
      Highlight,
      Subscript,
      Superscript,
      TableKit.configure({ table: { resizable: true } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: placeholder ?? "Start writing…" }),
    ],
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        role: "textbox",
        "aria-label": label,
        "aria-multiline": "true",
        class: "min-h-24 max-h-64 overflow-auto px-3 py-3 text-sm outline-none",
      },
    },
    onUpdate: ({ editor: current }) => {
      const plainText = current.getText({ blockSeparator: "\n" });
      onChange(plainText, plainText.trim() ? current.getHTML() : "");
    },
  });

  useEffect(() => {
    if (!editor) return;
    const textChanged = editor.getText({ blockSeparator: "\n" }) !== text;
    const formattingChanged = Boolean(html && editor.getHTML() !== html);
    if (textChanged || formattingChanged) {
      editor.commands.setContent(html || textDocument(text), { emitUpdate: false });
    }
  }, [editor, text, html]);

  return (
    <RichTextEditor editor={editor} className="min-w-0 rounded-lg border border-input bg-background">
      <RichTextEditor.Toolbar className="flex flex-wrap justify-start gap-y-1 border-b border-border px-2 py-1">
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.H1 />
          <RichTextEditor.H2 />
          <RichTextEditor.H3 />
        </RichTextEditor.ControlsGroup>
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Bold />
          <RichTextEditor.Italic />
          <RichTextEditor.Underline />
          <RichTextEditor.Strikethrough />
          <RichTextEditor.Highlight />
          <RichTextEditor.Subscript />
          <RichTextEditor.Superscript />
          <RichTextEditor.Link />
        </RichTextEditor.ControlsGroup>
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.BulletList />
          <RichTextEditor.OrderedList />
          <RichTextEditor.Control
            aria-label="Toggle checklist"
            title="Toggle checklist"
            onClick={() => editor?.chain().focus().toggleTaskList().run()}
          >
            <ListTodo className="size-4" />
          </RichTextEditor.Control>
          <RichTextEditor.Blockquote />
          <RichTextEditor.CodeBlock />
          <RichTextEditor.Control
            aria-label="Insert table"
            title="Insert table"
            onClick={() => editor?.chain().focus().insertTable({ rows: 2, cols: 2 }).run()}
          >
            <Table2 className="size-4" />
          </RichTextEditor.Control>
        </RichTextEditor.ControlsGroup>
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.AlignLeft />
          <RichTextEditor.AlignCenter />
          <RichTextEditor.AlignRight />
          <RichTextEditor.Undo />
          <RichTextEditor.Redo />
        </RichTextEditor.ControlsGroup>
      </RichTextEditor.Toolbar>
      <RichTextEditor.Content />
    </RichTextEditor>
  );
}
