import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Link } from "@editorcn/editor";
import { CharacterCount } from "@tiptap/extension-character-count";
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
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Code,
  Code2,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Highlighter,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  MoreHorizontal,
  Palette,
  Pilcrow,
  Plus,
  Quote,
  Redo2,
  Slash,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Table as TableIcon,
  Trash2,
  Underline as UnderlineIcon,
  Undo2,
  Unlink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";

type SlashCommand = {
  id: string;
  label: string;
  hint: string;
  shortcut?: string;
  icon: React.ReactNode;
  run: (editor: NonNullable<ReturnType<typeof useEditor>>) => void;
};

const TEXT_COLORS = [
  { label: "Default", value: "" },
  { label: "Blue", value: "#2563eb" },
  { label: "Emerald", value: "#059669" },
  { label: "Amber", value: "#d97706" },
  { label: "Rose", value: "#e11d48" },
  { label: "Violet", value: "#7c3aed" },
] as const;

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
  const [slashIndex, setSlashIndex] = useState(0);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [selectionMenu, setSelectionMenu] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [, setToolbarTick] = useState(0);

  const editor = useEditor({
    content: html || textDocument(text),
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: false,
      }),
      Link.configure({ openOnClick: false }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TableKit.configure({ table: { resizable: true } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      CharacterCount,
      Placeholder.configure({
        placeholder: placeholder
          ? `${placeholder} (Type / for commands)`
          : "Write here or type / for commands…",
      }),
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
          "min-h-[180px] max-h-[460px] overflow-auto px-4 py-3.5 text-sm leading-relaxed outline-none [&_h1]:mt-3 [&_h1]:mb-1.5 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-2.5 [&_h3]:mb-1 [&_h3]:text-base [&_h3]:font-semibold [&_h4]:mt-2 [&_h4]:mb-1 [&_h4]:text-sm [&_h4]:font-semibold [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul[data-type='taskList']]:list-none [&_ul[data-type='taskList']]:pl-0 [&_ul[data-type='taskList']_li]:flex [&_ul[data-type='taskList']_li]:items-start [&_ul[data-type='taskList']_li]:gap-2 [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs [&_hr]:my-3 [&_hr]:border-border [&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_td]:text-xs [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
      },
    },
    onUpdate: ({ editor: current }) => {
      const plainText = current.getText({ blockSeparator: "\n" });
      onChange(plainText, plainText.trim() ? current.getHTML() : "");
      setToolbarTick((n) => n + 1);
    },
    onSelectionUpdate: () => {
      setToolbarTick((n) => n + 1);
    },
  });

  const commands: SlashCommand[] = useMemo(
    () => [
      {
        id: "paragraph",
        label: "Text",
        hint: "Plain paragraph",
        icon: <Pilcrow className="size-3.5" />,
        run: (ed) => ed.chain().focus().setParagraph().run(),
      },
      {
        id: "h1",
        label: "Heading 1",
        hint: "Large section heading",
        shortcut: "#",
        icon: <Heading1 className="size-3.5" />,
        run: (ed) => ed.chain().focus().toggleHeading({ level: 1 }).run(),
      },
      {
        id: "h2",
        label: "Heading 2",
        hint: "Medium section heading",
        shortcut: "##",
        icon: <Heading2 className="size-3.5" />,
        run: (ed) => ed.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        id: "h3",
        label: "Heading 3",
        hint: "Sub-section heading",
        shortcut: "###",
        icon: <Heading3 className="size-3.5" />,
        run: (ed) => ed.chain().focus().toggleHeading({ level: 3 }).run(),
      },
      {
        id: "h4",
        label: "Heading 4",
        hint: "Compact heading",
        shortcut: "####",
        icon: <Heading4 className="size-3.5" />,
        run: (ed) => ed.chain().focus().toggleHeading({ level: 4 }).run(),
      },
      {
        id: "bullet",
        label: "Bulleted list",
        hint: "Unordered bullet points",
        shortcut: "-",
        icon: <List className="size-3.5" />,
        run: (ed) => ed.chain().focus().toggleBulletList().run(),
      },
      {
        id: "ordered",
        label: "Numbered list",
        hint: "Ordered steps",
        shortcut: "1.",
        icon: <ListOrdered className="size-3.5" />,
        run: (ed) => ed.chain().focus().toggleOrderedList().run(),
      },
      {
        id: "task",
        label: "Task checklist",
        hint: "Interactive todo checkboxes",
        shortcut: "[]",
        icon: <ListTodo className="size-3.5" />,
        run: (ed) => ed.chain().focus().toggleTaskList().run(),
      },
      {
        id: "quote",
        label: "Blockquote",
        hint: "Callout or quotation",
        shortcut: ">",
        icon: <Quote className="size-3.5" />,
        run: (ed) => ed.chain().focus().toggleBlockquote().run(),
      },
      {
        id: "codeblock",
        label: "Code block",
        hint: "Fenced monospace block",
        shortcut: "```",
        icon: <Code2 className="size-3.5" />,
        run: (ed) => ed.chain().focus().toggleCodeBlock().run(),
      },
      {
        id: "table",
        label: "Table",
        hint: "3×3 table with header row",
        icon: <TableIcon className="size-3.5" />,
        run: (ed) =>
          ed
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run(),
      },
      {
        id: "rule",
        label: "Horizontal divider",
        hint: "Visual section separator",
        shortcut: "---",
        icon: <Minus className="size-3.5" />,
        run: (ed) => ed.chain().focus().setHorizontalRule().run(),
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
        command.hint.toLowerCase().includes(q) ||
        command.id.includes(q),
    );
  }, [commands, slashQuery]);

  const activeSlashIndex = Math.min(
    slashIndex,
    Math.max(0, filteredCommands.length - 1),
  );

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
      const slashIdx = textBefore.lastIndexOf("/");
      if (slashIdx === -1) {
        setSlashOpen(false);
        return;
      }
      const beforeSlash = textBefore.slice(0, slashIdx);
      if (beforeSlash.trim() !== "") {
        setSlashOpen(false);
        return;
      }
      const query = textBefore.slice(slashIdx + 1);
      if (query.includes(" ")) {
        setSlashOpen(false);
        return;
      }
      setSlashQuery(query);
      setSlashIndex(0);
      setSlashPos($from.start() + slashIdx);
      const coords = editor.view.coordsAtPos(from);
      const container = containerRef.current?.getBoundingClientRect();
      if (container) {
        setMenuPos({
          top: coords.bottom - container.top + 6,
          left: Math.max(8, Math.min(coords.left - container.left, container.width - 280)),
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
        top: Math.max(4, start.top - container.top - 42),
        left: Math.max(8, Math.min(start.left - container.left, container.width - 260)),
      });
    };
    const clearSelection = () => setSelectionMenu(null);
    editor.on("selectionUpdate", syncSelection);
    editor.on("blur", clearSelection);
    return () => {
      editor.off("selectionUpdate", syncSelection);
      editor.off("blur", clearSelection);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const textChanged = editor.getText({ blockSeparator: "\n" }) !== text;
    const formattingChanged = Boolean(html && editor.getHTML() !== html);
    if (textChanged || formattingChanged) {
      editor.commands.setContent(html || textDocument(text), {
        emitUpdate: false,
      });
    }
  }, [editor, text, html]);

  function runCommand(command: SlashCommand) {
    if (!editor) return;
    if (slashPos !== null) {
      const from = slashPos;
      const to = editor.state.selection.from;
      editor.chain().focus().deleteRange({ from, to }).run();
    }
    command.run(editor);
    setSlashOpen(false);
    setSlashQuery("");
    setSlashPos(null);
  }

  function promptLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter link URL (https://...)", previous ?? "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  if (!editor) {
    return (
      <div className="min-h-[180px] rounded-xl border border-input bg-background px-4 py-3.5 text-sm text-muted-foreground">
        Loading editor…
      </div>
    );
  }

  const currentBlockLabel = editor.isActive("heading", { level: 1 })
    ? "Heading 1"
    : editor.isActive("heading", { level: 2 })
      ? "Heading 2"
      : editor.isActive("heading", { level: 3 })
        ? "Heading 3"
        : editor.isActive("heading", { level: 4 })
          ? "Heading 4"
          : editor.isActive("blockquote")
            ? "Quote"
            : editor.isActive("codeBlock")
              ? "Code block"
              : "Text";

  const inTable = editor.isActive("table");
  const wordCount = editor.storage.characterCount.words();
  const charCount = editor.storage.characterCount.characters();

  return (
    <div
      ref={containerRef}
      className="relative min-w-0 overflow-hidden rounded-xl border border-input bg-background shadow-2xs focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20"
      onKeyDown={(event) => {
        if (!slashOpen || filteredCommands.length === 0) return;
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSlashIndex((i) => (i + 1) % filteredCommands.length);
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          setSlashIndex(
            (i) => (i - 1 + filteredCommands.length) % filteredCommands.length,
          );
        } else if (event.key === "Enter") {
          event.preventDefault();
          const chosen = filteredCommands[activeSlashIndex];
          if (chosen) runCommand(chosen);
        } else if (event.key === "Escape") {
          event.preventDefault();
          setSlashOpen(false);
        }
      }}
    >
      <div
        role="toolbar"
        aria-label="Formatting options"
        className="flex flex-wrap items-center gap-1 border-b border-border/80 bg-muted/35 px-2 py-1.5"
      >
        {/* Block Style Dropdown */}
        <DropdownMenuTrigger>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="gap-1 px-2 font-medium text-foreground"
            aria-label="Text style"
          >
            <span>{currentBlockLabel}</span>
            <ChevronDown className="size-3 opacity-60" />
          </Button>
          <DropdownMenu className="min-w-44">
            <DropdownMenuLabel>Block style</DropdownMenuLabel>
            <DropdownMenuItem
              onAction={() => editor.chain().focus().setParagraph().run()}
            >
              <Pilcrow className="size-3.5" /> Normal text
            </DropdownMenuItem>
            <DropdownMenuItem
              onAction={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
            >
              <Heading1 className="size-3.5" /> Heading 1
              <Kbd className="ml-auto">#</Kbd>
            </DropdownMenuItem>
            <DropdownMenuItem
              onAction={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
            >
              <Heading2 className="size-3.5" /> Heading 2
              <Kbd className="ml-auto">##</Kbd>
            </DropdownMenuItem>
            <DropdownMenuItem
              onAction={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
            >
              <Heading3 className="size-3.5" /> Heading 3
              <Kbd className="ml-auto">###</Kbd>
            </DropdownMenuItem>
            <DropdownMenuItem
              onAction={() =>
                editor.chain().focus().toggleHeading({ level: 4 }).run()
              }
            >
              <Heading4 className="size-3.5" /> Heading 4
              <Kbd className="ml-auto">####</Kbd>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onAction={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <Quote className="size-3.5" /> Blockquote
              <Kbd className="ml-auto">&gt;</Kbd>
            </DropdownMenuItem>
            <DropdownMenuItem
              onAction={() => editor.chain().focus().toggleCodeBlock().run()}
            >
              <Code2 className="size-3.5" /> Code block
              <Kbd className="ml-auto">```</Kbd>
            </DropdownMenuItem>
          </DropdownMenu>
        </DropdownMenuTrigger>

        <Separator orientation="vertical" className="mx-0.5 h-4" />

        {/* Core Inline Formatting */}
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant={editor.isActive("bold") ? "secondary" : "ghost"}
            size="icon-xs"
            aria-label="Bold"
            onPress={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("italic") ? "secondary" : "ghost"}
            size="icon-xs"
            aria-label="Italic"
            onPress={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("underline") ? "secondary" : "ghost"}
            size="icon-xs"
            aria-label="Underline"
            onPress={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("strike") ? "secondary" : "ghost"}
            size="icon-xs"
            aria-label="Strikethrough"
            onPress={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("code") ? "secondary" : "ghost"}
            size="icon-xs"
            aria-label="Inline code"
            onPress={() => editor.chain().focus().toggleCode().run()}
          >
            <Code className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("link") ? "secondary" : "ghost"}
            size="icon-xs"
            aria-label="Insert or edit link"
            onPress={promptLink}
          >
            <LinkIcon className="size-3.5" />
          </Button>
        </div>

        <Separator orientation="vertical" className="mx-0.5 h-4" />

        {/* Lists Dropdown */}
        <DropdownMenuTrigger>
          <Button
            type="button"
            variant={
              editor.isActive("bulletList") ||
              editor.isActive("orderedList") ||
              editor.isActive("taskList")
                ? "secondary"
                : "ghost"
            }
            size="xs"
            className="gap-1 px-1.5"
            aria-label="Lists"
          >
            <List className="size-3.5" />
            <ChevronDown className="size-3 opacity-60" />
          </Button>
          <DropdownMenu className="min-w-44">
            <DropdownMenuLabel>Lists</DropdownMenuLabel>
            <DropdownMenuItem
              onAction={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List className="size-3.5" /> Bulleted list
              <Kbd className="ml-auto">-</Kbd>
            </DropdownMenuItem>
            <DropdownMenuItem
              onAction={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="size-3.5" /> Numbered list
              <Kbd className="ml-auto">1.</Kbd>
            </DropdownMenuItem>
            <DropdownMenuItem
              onAction={() => editor.chain().focus().toggleTaskList().run()}
            >
              <ListTodo className="size-3.5" /> Task checklist
              <Kbd className="ml-auto">[]</Kbd>
            </DropdownMenuItem>
          </DropdownMenu>
        </DropdownMenuTrigger>

        {/* Alignment Dropdown */}
        <DropdownMenuTrigger>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="gap-1 px-1.5"
            aria-label="Text alignment"
          >
            <AlignLeft className="size-3.5" />
            <ChevronDown className="size-3 opacity-60" />
          </Button>
          <DropdownMenu className="min-w-36">
            <DropdownMenuLabel>Alignment</DropdownMenuLabel>
            <DropdownMenuItem
              onAction={() => editor.chain().focus().setTextAlign("left").run()}
            >
              <AlignLeft className="size-3.5" /> Left
            </DropdownMenuItem>
            <DropdownMenuItem
              onAction={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
            >
              <AlignCenter className="size-3.5" /> Center
            </DropdownMenuItem>
            <DropdownMenuItem
              onAction={() =>
                editor.chain().focus().setTextAlign("right").run()
              }
            >
              <AlignRight className="size-3.5" /> Right
            </DropdownMenuItem>
            <DropdownMenuItem
              onAction={() =>
                editor.chain().focus().setTextAlign("justify").run()
              }
            >
              <AlignJustify className="size-3.5" /> Justify
            </DropdownMenuItem>
          </DropdownMenu>
        </DropdownMenuTrigger>

        {/* Insert Dropdown (Table, Divider, Table Controls) */}
        <DropdownMenuTrigger>
          <Button
            type="button"
            variant={inTable ? "secondary" : "ghost"}
            size="xs"
            className="gap-1 px-1.5"
            aria-label="Insert elements"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Insert</span>
            <ChevronDown className="size-3 opacity-60" />
          </Button>
          <DropdownMenu className="min-w-44">
            <DropdownMenuLabel>Insert</DropdownMenuLabel>
            <DropdownMenuItem
              onAction={() =>
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run()
              }
            >
              <TableIcon className="size-3.5" /> Table (3×3)
            </DropdownMenuItem>
            <DropdownMenuItem
              onAction={() => editor.chain().focus().setHorizontalRule().run()}
            >
              <Minus className="size-3.5" /> Horizontal rule
              <Kbd className="ml-auto">---</Kbd>
            </DropdownMenuItem>
            {inTable && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Table actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onAction={() => editor.chain().focus().addRowAfter().run()}
                >
                  <Plus className="size-3.5" /> Add row below
                </DropdownMenuItem>
                <DropdownMenuItem
                  onAction={() => editor.chain().focus().addColumnAfter().run()}
                >
                  <Plus className="size-3.5" /> Add column right
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onAction={() => editor.chain().focus().deleteTable().run()}
                >
                  <Trash2 className="size-3.5" /> Delete table
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenu>
        </DropdownMenuTrigger>

        {/* More Formatting Dropdown */}
        <DropdownMenuTrigger>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="More formatting"
          >
            <MoreHorizontal className="size-3.5" />
          </Button>
          <DropdownMenu className="min-w-48">
            <DropdownMenuLabel>More formatting</DropdownMenuLabel>
            <DropdownMenuItem
              onAction={() => editor.chain().focus().toggleHighlight().run()}
            >
              <Highlighter className="size-3.5" /> Highlight
            </DropdownMenuItem>
            <DropdownMenuItem
              onAction={() => editor.chain().focus().toggleSuperscript().run()}
            >
              <SuperscriptIcon className="size-3.5" /> Superscript
            </DropdownMenuItem>
            <DropdownMenuItem
              onAction={() => editor.chain().focus().toggleSubscript().run()}
            >
              <SubscriptIcon className="size-3.5" /> Subscript
            </DropdownMenuItem>
            {editor.isActive("link") && (
              <DropdownMenuItem
                onAction={() => editor.chain().focus().unsetLink().run()}
              >
                <Unlink className="size-3.5" /> Remove link
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Text color</DropdownMenuLabel>
            {TEXT_COLORS.map((swatch) => (
              <DropdownMenuItem
                key={swatch.label}
                onAction={() =>
                  swatch.value
                    ? editor.chain().focus().setColor(swatch.value).run()
                    : editor.chain().focus().unsetColor().run()
                }
              >
                <Palette
                  className="size-3.5"
                  style={swatch.value ? { color: swatch.value } : undefined}
                />
                {swatch.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onAction={() =>
                editor.chain().focus().unsetAllMarks().clearNodes().run()
              }
            >
              <Eraser className="size-3.5" /> Clear formatting
            </DropdownMenuItem>
          </DropdownMenu>
        </DropdownMenuTrigger>

        <Separator orientation="vertical" className="mx-0.5 h-4" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Undo"
            isDisabled={!editor.can().undo()}
            onPress={() => editor.chain().focus().undo().run()}
          >
            <Undo2 className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Redo"
            isDisabled={!editor.can().redo()}
            onPress={() => editor.chain().focus().redo().run()}
          >
            <Redo2 className="size-3.5" />
          </Button>
        </div>

        {/* Slash Commands Discoverable Trigger */}
        <DropdownMenuTrigger>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="ml-auto gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            aria-label="Slash commands"
          >
            <Slash className="size-3" />
            <span className="hidden sm:inline">Commands</span>
          </Button>
          <DropdownMenu placement="bottom end" className="min-w-56">
            <DropdownMenuLabel>Type / on a new line, or pick:</DropdownMenuLabel>
            {commands.map((command) => (
              <DropdownMenuItem
                key={command.id}
                onAction={() => command.run(editor)}
              >
                {command.icon}
                <span>{command.label}</span>
                {command.shortcut && (
                  <Kbd className="ml-auto">{command.shortcut}</Kbd>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenu>
        </DropdownMenuTrigger>
      </div>

      <EditorContent editor={editor} />

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 bg-muted/20 px-3 py-1.5 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          Type <Kbd>/</Kbd> for commands · Markdown shortcuts supported (
          <code>#</code>, <code>**bold**</code>, <code>`code`</code>,{" "}
          <code>&gt;</code>, <code>-</code>)
        </span>
        <span className="tabular-nums">
          {wordCount} {wordCount === 1 ? "word" : "words"} · {charCount} chars
        </span>
      </div>

      {selectionMenu && !slashOpen && (
        <div
          className="absolute z-40 flex items-center gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-md ring-1 ring-foreground/10"
          style={{ top: selectionMenu.top, left: selectionMenu.left }}
        >
          <button
            type="button"
            className={`rounded p-1.5 hover:bg-muted ${editor.isActive("bold") ? "bg-muted text-foreground" : ""}`}
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleBold().run();
            }}
            aria-label="Bold"
          >
            <Bold className="size-3.5" />
          </button>
          <button
            type="button"
            className={`rounded p-1.5 hover:bg-muted ${editor.isActive("italic") ? "bg-muted text-foreground" : ""}`}
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleItalic().run();
            }}
            aria-label="Italic"
          >
            <Italic className="size-3.5" />
          </button>
          <button
            type="button"
            className={`rounded p-1.5 hover:bg-muted ${editor.isActive("underline") ? "bg-muted text-foreground" : ""}`}
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleUnderline().run();
            }}
            aria-label="Underline"
          >
            <UnderlineIcon className="size-3.5" />
          </button>
          <button
            type="button"
            className={`rounded p-1.5 hover:bg-muted ${editor.isActive("strike") ? "bg-muted text-foreground" : ""}`}
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleStrike().run();
            }}
            aria-label="Strikethrough"
          >
            <Strikethrough className="size-3.5" />
          </button>
          <button
            type="button"
            className={`rounded p-1.5 hover:bg-muted ${editor.isActive("code") ? "bg-muted text-foreground" : ""}`}
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleCode().run();
            }}
            aria-label="Inline code"
          >
            <Code className="size-3.5" />
          </button>
          <button
            type="button"
            className={`rounded p-1.5 hover:bg-muted ${editor.isActive("highlight") ? "bg-muted text-foreground" : ""}`}
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleHighlight().run();
            }}
            aria-label="Highlight"
          >
            <Highlighter className="size-3.5" />
          </button>
          <button
            type="button"
            className={`rounded p-1.5 hover:bg-muted ${editor.isActive("link") ? "bg-muted text-foreground" : ""}`}
            onMouseDown={(e) => {
              e.preventDefault();
              promptLink();
            }}
            aria-label="Link"
          >
            <LinkIcon className="size-3.5" />
          </button>
        </div>
      )}

      {slashOpen && menuPos && (
        <div
          className="absolute z-50 w-68 overflow-hidden rounded-xl border border-border bg-popover shadow-lg ring-1 ring-foreground/10"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          <div className="border-b border-border/80 bg-muted/35 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            {slashQuery ? `Commands matching “${slashQuery}”` : "Slash commands"}
          </div>
          <div className="max-h-64 overflow-auto p-1">
            {filteredCommands.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                No matching commands.
              </div>
            ) : (
              filteredCommands.map((command, idx) => (
                <button
                  key={command.id}
                  type="button"
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                    idx === activeSlashIndex
                      ? "bg-muted text-foreground"
                      : "hover:bg-muted/70"
                  }`}
                  onMouseEnter={() => setSlashIndex(idx)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    runCommand(command);
                  }}
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background text-muted-foreground">
                    {command.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-foreground">
                      {command.label}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {command.hint}
                    </span>
                  </span>
                  {command.shortcut && <Kbd>{command.shortcut}</Kbd>}
                </button>
              ))
            )}
          </div>
          <div className="border-t border-border/80 bg-muted/25 px-3 py-1 text-[10px] text-muted-foreground">
            ↑↓ Navigate · Enter Insert · Esc Close
          </div>
        </div>
      )}
    </div>
  );
}
