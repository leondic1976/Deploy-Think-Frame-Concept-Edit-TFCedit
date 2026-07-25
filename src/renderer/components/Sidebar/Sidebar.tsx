import { useMemo, useState } from 'react';
import type { FileSummary, SupportedExtension } from '../../../shared/contracts';
import { formatModifiedAt } from '../../utils/formatting';

interface SidebarProps {
  workspacePath: string | null;
  files: FileSummary[];
  activePath?: string;
  onSelectWorkspace: () => void;
  onCreate: (extension: SupportedExtension) => void;
  onOpen: (relativePath: string) => void;
  onRename: (file: FileSummary) => void;
  onDuplicate: (file: FileSummary) => void;
  onSaveAs: (file: FileSummary) => void;
  onRemove: (file: FileSummary) => void;
  onReveal: (file: FileSummary) => void;
}

export function Sidebar({
  workspacePath,
  files,
  activePath,
  onSelectWorkspace,
  onCreate,
  onOpen,
  onRename,
  onDuplicate,
  onSaveAs,
  onRemove,
  onReveal,
}: SidebarProps): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const filtered = useMemo(
    () =>
      files.filter((file) =>
        file.relativePath.toLowerCase().includes(query.toLowerCase()),
      ),
    [files, query],
  );

  return (
    <aside className="sidebar panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">WORKSPACE</span>
          <strong title={workspacePath ?? ''}>
            {workspacePath?.split(/[\\/]/).at(-1) ?? '작업공간 없음'}
          </strong>
        </div>
        <button
          className="icon-button"
          aria-label="작업공간 폴더 선택"
          title="작업공간 선택 (Ctrl+O)"
          onClick={onSelectWorkspace}
        >
          …
        </button>
      </div>
      <div className="new-document-group">
        <button
          className="primary new-document"
          onClick={() => onCreate('.md')}
          disabled={!workspacePath}
        >
          <span>＋</span> 새 Markdown
        </button>
        <button
          className="new-text-document"
          onClick={() => onCreate('.txt')}
          disabled={!workspacePath}
          aria-label="새 TXT 문서"
          title="새 TXT 문서 (Ctrl+Shift+N)"
        >
          TXT
        </button>
      </div>
      <label className="search">
        <span aria-hidden="true">⌕</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="파일 이름 검색"
          aria-label="파일 이름 검색"
        />
      </label>
      <div className="file-section-title">
        <span>최근 문서</span>
        <span>{filtered.length}</span>
      </div>
      <div className="file-list" role="list">
        {workspacePath && filtered.length === 0 && (
          <div className="empty-small">Markdown 또는 TXT 문서가 없습니다.</div>
        )}
        {filtered.map((file) => (
          <div
            key={file.relativePath}
            className={`file-row ${activePath === file.relativePath ? 'active' : ''}`}
            onContextMenu={(event) => {
              event.preventDefault();
              setMenuPath(file.relativePath);
            }}
            role="listitem"
          >
            <button className="file-main" onClick={() => onOpen(file.relativePath)}>
              <span className={`file-type ${file.extension === '.md' ? 'markdown' : ''}`}>
                {file.extension === '.md' ? 'M' : 'T'}
              </span>
              <span className="file-meta">
                <strong title={file.relativePath}>{file.name}</strong>
                <small>{formatModifiedAt(file.modifiedAt)}</small>
              </span>
            </button>
            <button
              className="file-menu-trigger"
              aria-label={`${file.name} 문서 메뉴`}
              onClick={() =>
                setMenuPath(menuPath === file.relativePath ? null : file.relativePath)
              }
            >
              ⋯
            </button>
            {menuPath === file.relativePath && (
              <div className="file-menu" onMouseLeave={() => setMenuPath(null)}>
                <button onClick={() => onRename(file)}>이름 변경</button>
                <button onClick={() => onSaveAs(file)}>다른 이름으로 저장</button>
                <button onClick={() => onDuplicate(file)}>복제</button>
                <button onClick={() => onReveal(file)}>탐색기에서 보기</button>
                <button className="danger-text" onClick={() => onRemove(file)}>
                  휴지통으로 이동
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
