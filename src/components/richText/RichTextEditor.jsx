import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import BulletList from '@tiptap/extension-bullet-list';
import ListItem from '@tiptap/extension-list-item';

const RichTextEditor = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Bold,
      Italic,
      BulletList,
      ListItem,
    ],
    content: value,
    editorProps: {
      handlePaste(view, event) {
        const html = event.clipboardData.getData('text/html');
        const plain = event.clipboardData.getData('text/plain');

        if (html) {
          // If HTML exists, let Tiptap parse and keep formatting
          return false;
        } else {
          // Convert plain text to HTML with line breaks and bullets
          const lines = plain.split(/\r?\n/).filter(line => line.trim());

          if (lines.length > 1) {
            const htmlList = `<ul>${lines.map(line => `<li>${line}</li>`).join('')}</ul>`;
            editor.commands.insertContent(htmlList);
            event.preventDefault();
            return true;
          } else {
            editor.commands.insertContent(plain.replace(/\n/g, '<br>'));
            event.preventDefault();
            return true;
          }
        }
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  return (
    <div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;