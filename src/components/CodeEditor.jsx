import React, { useEffect, useRef } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { yaml } from '@codemirror/lang-yaml';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';
import { closeBrackets } from '@codemirror/autocomplete';
import { highlightSelectionMatches } from '@codemirror/search';

const languageMap = {
  python: python,
  yaml: yaml,
  markdown: markdown,
};

const CodeEditor = ({ value, onChange, language = 'python', readOnly = false, fontSize = 14, wordWrap = true }) => {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!editorRef.current) return;

    const langExtension = languageMap[language] ? languageMap[language]() : [];

    const extensions = [
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      bracketMatching(),
      closeBrackets(),
      highlightSelectionMatches(),
      syntaxHighlighting(defaultHighlightStyle),
      keymap.of([...defaultKeymap, indentWithTab]),
      langExtension,
      oneDark,
      EditorView.theme({
        '&': {
          height: '100%',
          fontSize: `${fontSize}px`,
        },
        '.cm-scroller': {
          fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
          overflow: 'auto',
        },
        '.cm-gutters': {
          backgroundColor: '#0f172a',
          borderRight: '1px solid #1e293b',
        },
        '.cm-activeLineGutter': {
          backgroundColor: '#1e293b',
        },
        '.cm-activeLine': {
          backgroundColor: '#1e293b44',
        },
      }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && onChangeRef.current) {
          onChangeRef.current(update.state.doc.toString());
        }
      }),
    ];

    if (wordWrap) {
      extensions.push(EditorView.lineWrapping);
    }

    if (readOnly) {
      extensions.push(EditorState.readOnly.of(true));
    }

    const state = EditorState.create({
      doc: value || '',
      extensions,
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [language, readOnly, fontSize, wordWrap]);

  // Update content when value prop changes externally (e.g. switching files)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentContent = view.state.doc.toString();
    if (value !== currentContent) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: value || '',
        },
      });
    }
  }, [value]);

  return (
    <div ref={editorRef} className="h-full w-full overflow-hidden" />
  );
};

export default CodeEditor;
