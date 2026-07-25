import { useMemo, useState, type RefObject } from 'react';
import type { SupportedExtension } from '../../../shared/contracts';
import {
  findLiteralMatch,
  replaceAllLiteral,
  replaceLiteralSelection,
} from '../../utils/editorOperations';
import { countWords } from '../../utils/formatting';

interface EditorProps {
  documentName: string;
  content: string;
  disabled: boolean;
  fontSize: number;
  lineHeight: number;
  readableLineLength: boolean;
  spellCheck: boolean;
  findOpen: boolean;
  cursorPosition: number;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onChange: (content: string) => void;
  onSelect: (start: number, end: number) => void;
  onFindOpen: (value: boolean) => void;
  onSelectWorkspace: () => void;
  onCreate: (extension: SupportedExtension) => void;
}

export function Editor({
  documentName,
  content,
  disabled,
  fontSize,
  lineHeight,
  readableLineLength,
  spellCheck,
  findOpen,
  cursorPosition,
  textareaRef,
  onChange,
  onSelect,
  onFindOpen,
  onSelectWorkspace,
  onCreate,
}: EditorProps): React.JSX.Element {
  const [findQuery, setFindQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const lineAndColumn = useMemo(() => {
    const lines = content.slice(0, cursorPosition).split('\n');
    return {
      line: lines.length,
      column: (lines.at(-1)?.length ?? 0) + 1,
    };
  }, [content, cursorPosition]);

  const selectMatch = (direction: 'next' | 'previous'): void => {
    if (!findQuery || !textareaRef.current) return;
    const editor = textareaRef.current;
    const match = findLiteralMatch(
      content,
      findQuery,
      direction === 'next' ? editor.selectionEnd : editor.selectionStart,
      direction,
    );
    if (!match) return;
    editor.focus();
    editor.setSelectionRange(match.start, match.end);
    onSelect(match.start, match.end);
  };

  const replaceSelection = (): void => {
    const editor = textareaRef.current;
    if (!editor || !findQuery) return;
    const result = replaceLiteralSelection(content, findQuery, replacement, {
      start: editor.selectionStart,
      end: editor.selectionEnd,
    });
    if (!result) {
      selectMatch('next');
      return;
    }
    onChange(result.content);
    window.setTimeout(() => {
      editor.focus();
      editor.setSelectionRange(result.selection.start, result.selection.end);
      onSelect(result.selection.start, result.selection.end);
    }, 0);
  };

  const replaceAll = (): void => {
    if (!findQuery) return;
    onChange(replaceAllLiteral(content, findQuery, replacement).content);
  };

  if (disabled) {
    return (
      <main className="editor panel editor-empty">
        <div className="empty-illustration">
          <span className="empty-mark">T</span>
        </div>
        <h1>생각을 적을 공간을 선택하세요</h1>
        <p>로컬 폴더의 Markdown과 TXT 문서를 안전하게 편집합니다.</p>
        <div className="empty-actions">
          <button className="primary" onClick={onSelectWorkspace}>
            작업공간 선택
          </button>
          <button onClick={() => onCreate('.md')}>새 Markdown</button>
          <button onClick={() => onCreate('.txt')}>새 TXT</button>
        </div>
      </main>
    );
  }

  return (
    <main className={`editor panel ${findOpen ? 'finding' : ''}`}>
      <div className="editor-heading">
        <div>
          <span className="eyebrow">CURRENT THOUGHT</span>
          <h1>{documentName}</h1>
        </div>
        <div className="editor-tools">
          <button onClick={() => onFindOpen(true)}>찾기</button>
          <span className="editor-format">
            {documentName.toLowerCase().endsWith('.md') ? 'Markdown' : 'Text'}
          </span>
        </div>
      </div>
      {findOpen && (
        <div className="find-bar">
          <input
            autoFocus
            value={findQuery}
            onChange={(event) => setFindQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter')
                selectMatch(event.shiftKey ? 'previous' : 'next');
              if (event.key === 'Escape') onFindOpen(false);
            }}
            placeholder="찾을 내용"
            aria-label="문서에서 찾기"
          />
          <input
            value={replacement}
            onChange={(event) => setReplacement(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') onFindOpen(false);
            }}
            placeholder="바꿀 내용"
            aria-label="바꿀 내용"
          />
          <button onClick={() => selectMatch('previous')} aria-label="이전 찾기">
            ↑
          </button>
          <button onClick={() => selectMatch('next')} aria-label="다음 찾기">
            ↓
          </button>
          <button onClick={replaceSelection}>바꾸기</button>
          <button onClick={replaceAll}>모두 바꾸기</button>
          <button onClick={() => onFindOpen(false)} aria-label="찾기 닫기">
            ×
          </button>
        </div>
      )}
      <textarea
        ref={textareaRef}
        className={`editor-textarea ${readableLineLength ? 'readable-line-length' : ''}`}
        style={{ fontSize, lineHeight }}
        value={content}
        onChange={(event) => onChange(event.target.value)}
        onSelect={(event) => {
          const target = event.currentTarget;
          onSelect(target.selectionStart, target.selectionEnd);
        }}
        placeholder="자유롭게 생각을 입력하세요…"
        aria-label="문서 편집기"
        spellCheck={spellCheck}
        wrap="on"
      />
      <footer className="editor-status">
        <span>
          {lineAndColumn.line}행 {lineAndColumn.column}열
        </span>
        <span>{countWords(content).toLocaleString('ko-KR')}단어</span>
        <span>{content.length.toLocaleString('ko-KR')}자</span>
        <span>UTF-8</span>
      </footer>
    </main>
  );
}
