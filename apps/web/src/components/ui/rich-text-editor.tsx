import { useEffect, useMemo, useRef, useState } from "react";
import { useEditor } from "@tiptap/react";
import { Link, RichTextEditor } from "@editorcn/editor";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";

import { Placeholder } from "@tiptap/extension-placeholder";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { TableKit } from "@tiptap/extension-table";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { StarterKit } from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  Palette,
  Quote,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Minus,
} from "lucide-react";
import "@editorcn/editor/style.css";

type SlashCommand = {
  id: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
  run: (editor: ReturnType<typeof useEditor>) => void;
};

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashPos, setSlashPos] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [color, setColor] = useState("#000000");
  const [selectionMenu, setSelectionMenu] = useState<{ top: number; left: number } | null>(null);

  const editor = useEditor({
    content: html || textDocument(text),
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false }),
      Link,
      TextStyle,
      Color,
      Highlight,
      Subscript,
      Superscript,
      TableKit.configure({ table: { resizable: true } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: placeholder ?? "Type / for commands…" }),
    ],
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        role: "textbox",
        "aria-label": label,
        "aria-multiline": "true",
        class:
          "min-h-[220px] max-h-[520px] overflow-auto px-6 py-5 text-[15px] leading-7 outline-none prose prose-sm dark:prose-invert max-w-none",
      },
    },
    onUpdate: ({ editor: current }) => {
      const plainText = current.getText({ blockSeparator: "\n" });
      onChange(plainText, plainText.trim() ? current.getHTML() : "");
    },
  });

  const commands: SlashCommand[] = useMemo(
    () => [
      {
        id: "paragraph",
        label: "Text",
        hint: "Plain paragraph",
        icon: <span className="text-xs font-bold">T</span>,
        run: (ed) => ed?.chain().focus().setParagraph().run(),
      },
      {
        id: "h1",
        label: "Heading 1",
        hint: "Big section title",
        icon: <Heading1 className="size-4" />,
        run: (ed) => ed?.chain().focus().toggleHeading({ level: 1 }).run(),
      },
      {
        id: "h2",
        label: "Heading 2",
        hint: "Section title",
        icon: <Heading2 className="size-4" />,
        run: (ed) => ed?.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        id: "h3",
        label: "Heading 3",
        hint: "Sub-section title",
        icon: <Heading3 className="size-4" />,
        run: (ed) => ed?.chain().focus().toggleHeading({ level: 3 }).run(),
      },
      {
        id: "bullet",
        label: "Bulleted list",
        hint: "Simple bullet list",
        icon: <List className="size-4" />,
        run: (ed) => ed?.chain().focus().toggleBulletList().run(),
      },
      {
        id: "ordered",
        label: "Numbered list",
        hint: "Ordered list",
        icon: <ListOrdered className="size-4" />,
        run: (ed) => ed?.chain().focus().toggleOrderedList().run(),
      },
      {
        id: "task",
        label: "Checklist",
        hint: "Todo items",
        icon: <ListTodo className="size-4" />,
        run: (ed) => ed?.chain().focus().toggleTaskList().run(),
      },
      {
        id: "quote",
        label: "Quote",
        hint: "Blockquote",
        icon: <Quote className="size-4" />,
        run: (ed) => ed?.chain().focus().toggleBlockquote().run(),
      },
      {
        id: "code",
        label: "Code block",
        hint: "Monospaced code",
        icon: <Code className="size-4" />,
        run: (ed) => ed?.chain().focus().toggleCodeBlock().run(),
      },
      {
        id: "table",
        label: "Table",
        hint: "2x2 table",
        icon: <TableIcon className="size-4" />,
        run: (ed) => ed?.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run(),
      },
      {
        id: "rule",
        label: "Divider",
        hint: "Horizontal rule",
        icon: <Minus className="size-4" />,
        run: (ed) => ed?.chain().focus().setHorizontalRule().run(),
      },
    ],
    [],
  );

  const filteredCommands = useMemo(() => {
    const q = slashQuery.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (command) =>
        command.label.toLowerCase().includes(q) ||
        command.hint.toLowerCase().includes(q),
    );
  }, [commands, slashQuery]);

  useEffect(() => {
    if (!editor) return;
    const syncSlash = () => {
      const { from } = editor.state.selection;
      const $from = editor.state.doc.resolve(from);
      const parent = $from.parent;
      if (parent.type.name !== "paragraph") {
        setSlashOpen(false);
        return;
      }
      const textBefore = parent.textContent.slice(0, $from.parentOffset);
      const slashIndex = textBefore.lastIndexOf("/");
      if (slashIndex === -1) {
        setSlashOpen(false);
        return;
      }
      const beforeSlash = textBefore.slice(0, slashIndex);
      if (beforeSlash.trim() !== "") {
        setSlashOpen(false);
        return;
      }
      const query = textBefore.slice(slashIndex + 1);
      if (query.includes(" ")) {
        setSlashOpen(false);
        return;
      }
      setSlashQuery(query);
      setSlashPos($from.start() + slashIndex);
      const coords = editor.view.coordsAtPos(from);
      const container = containerRef.current?.getBoundingClientRect();
      if (container) {
        setMenuPos({
          top: coords.bottom - container.top + 6,
          left: Math.max(8, coords.left - container.left),
        });
      }
      setSlashOpen(true);
    };

    editor.on("selectionUpdate", syncSlash);
    editor.on("update", syncSlash);
    return () => {
      editor.off("selectionUpdate", syncSlash);
      editor.off("update", syncSlash);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const syncSelection = () => {
      const { from, to } = editor.state.selection;
      if (from === to) {
        setSelectionMenu(null);
        return;
      }
      const start = editor.view.coordsAtPos(from);
      const container = containerRef.current?.getBoundingClientRect();
      if (!container) return;
      setSelectionMenu({
        top: start.top - container.top - 44,
        left: Math.max(8, start.left - container.left),
      });
    };
    editor.on("selectionUpdate", syncSelection);
    editor.on("blur", () => setSelectionMenu(null));
    return () => {
      editor.off("selectionUpdate", syncSelection);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const textChanged = editor.getText({ blockSeparator: "\n" }) !== text;
    const formattingChanged = Boolean(html && editor.getHTML() !== html);
    if (textChanged || formattingChanged) {
      editor.commands.setContent(html || textDocument(text), { emitUpdate: false });
    }
  }, [editor, text, html]);

  function runCommand(command: SlashCommand) {
    if (!editor || slashPos === null) return;
    const from = slashPos;
    const to = editor.state.selection.from;
    editor.chain().focus().deleteRange({ from, to }).run();
    command.run(editor);
    setSlashOpen(false);
    setSlashQuery("");
    setSlashPos(null);
  }

  if (!editor) {
    return (
      <div className="min-h-[220px] rounded-lg border border-input bg-background px-6 py-5 text-sm text-muted-foreground">
        Loading editor…
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <RichTextEditor
        editor={editor}
        className="min-w-0 rounded-xl border border-input bg-background shadow-xs"
      >
        <RichTextEditor.Toolbar className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 px-3 py-2">
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
              onClick={() => editor.chain().focus().toggleTaskList().run()}
            >
              <ListTodo className="size-4" />
            </RichTextEditor.Control>
            <RichTextEditor.Blockquote />
            <RichTextEditor.CodeBlock />
            <RichTextEditor.Control
              aria-label="Insert table"
              title="Insert table"
              onClick={() => editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run()}
            >
              <TableIcon className="size-4" />
            </RichTextEditor.Control>
            <RichTextEditor.Control
              aria-label="Insert divider"
              title="Insert divider"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
            >
              <Minus className="size-4" />
            </RichTextEditor.Control>
          </RichTextEditor.ControlsGroup>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.AlignLeft />
            <RichTextEditor.AlignCenter />
            <RichTextEditor.AlignRight />
            <RichTextEditor.Undo />
            <RichTextEditor.Redo />
          </RichTextEditor.ControlsGroup>
          <div className="ml-auto flex items-center gap-1.5">
            <label
              className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
              title="Text color"
            >
              <Palette className="size-3.5" />
              <input
                type="color"
                value={color}
                onChange={(event) => {
                  setColor(event.target.value);
                  editor.chain().focus().setColor(event.target.value).run();
                }}
                className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
                aria-label="Text color"
              />
            </label>
          </div>
        </RichTextEditor.Toolbar>
        <RichTextEditor.Content />
      </RichTextEditor>

      {selectionMenu && !slashOpen && (
        <div
          className="absolute z-40 flex items-center gap-0.5 rounded-lg border border-border bg-popover px-1 py-1 shadow-lg"
          style={{ top: selectionMenu.top, left: selectionMenu.left }}
        >
          <button type="button" className="rounded p-1.5 hover:bg-muted" onClick={() => editor.chain().focus().toggleBold().run()} aria-label="Bold">
            <Bold className="size-3.5" />
          </button>
          <button type="button" className="rounded p-1.5 hover:bg-muted" onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="Italic">
            <Italic className="size-3.5" />
          </button>
          <button type="button" className="rounded p-1.5 hover:bg-muted" onClick={() => editor.chain().focus().toggleUnderline().run()} aria-label="Underline">
            <UnderlineIcon className="size-3.5" />
          </button>
          <button type="button" className="rounded p-1.5 hover:bg-muted" onClick={() => editor.chain().focus().toggleStrike().run()} aria-label="Strikethrough">
            <Strikethrough className="size-3.5" />
          </button>
          <button type="button" className="rounded p-1.5 hover:bg-muted" onClick={() => editor.chain().focus().toggleHighlight().run()} aria-label="Highlight">
            <Highlighter className="size-3.5" />
          </button>
          <button type="button" className="rounded p-1.5 hover:bg-muted" onClick={() => editor.chain().focus().toggleCode().run()} aria-label="Inline code">
            <Code className="size-3.5" />
          </button>
          <button
            type="button"
            className="rounded p-1.5 hover:bg-muted"
            onClick={() => {
              const url = window.prompt("Link URL");
              if (url) editor.chain().focus().setLink({ href: url }).run();
            }}
            aria-label="Link"
          >
            <LinkIcon className="size-3.5" />
          </button>
        </div>
      )}

      {slashOpen && menuPos && (
        <div
          className="absolute z-50 w-64 overflow-hidden rounded-xl border border-border bg-popover shadow-xl"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          <div className="border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground">
            {slashQuery ? `Commands matching “${slashQuery}”` : "Insert block"}
          </div>
          <div className="max-h-64 overflow-auto p-1">
            {filteredCommands.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">No matching commands.</div>
            ) : (
              filteredCommands.map((command) => (
                <button
                  key={command.id}
                  type="button"
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    runCommand(command);
                  }}
                >
                  <span className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    {command.icon}
                  </span>
                  <span className="flex flex-col">
                    <span className="font-medium">{command.label}</span>
                    <span className="text-xs text-muted-foreground">{command.hint}</span>
                  </span>
                </button>
              ))
            )}
          </div>
          <div className="border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
            Type to filter · Enter to insert
          </div>
        </div>
      )}
    </div>
  );
}
