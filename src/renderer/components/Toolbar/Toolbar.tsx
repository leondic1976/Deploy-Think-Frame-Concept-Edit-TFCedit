import type { SaveStatus } from '../../state/appStore';

interface ToolbarProps {
  documentName: string;
  version: string;
  saveStatus: SaveStatus;
  onToggleSidebar: () => void;
  onToggleAssistant: () => void;
  onSettings: () => void;
}

const SAVE_LABELS: Record<SaveStatus, string> = {
  idle: '',
  dirty: '변경됨',
  saving: '저장 중…',
  saved: '저장됨',
  conflict: '충돌 확인 필요',
  error: '저장 실패',
};

export function Toolbar({
  documentName,
  version,
  saveStatus,
  onToggleSidebar,
  onToggleAssistant,
  onSettings,
}: ToolbarProps): React.JSX.Element {
  return (
    <header className="app-toolbar">
      <div className="titlebar-brand">
        <span className="brand-mark">T</span>
        <strong>ThinkFrame</strong>
        <span className="version">v{version}</span>
      </div>
      <div className="titlebar-document">
        <span>{documentName || '문서를 선택하세요'}</span>
        {SAVE_LABELS[saveStatus] && (
          <small className={`save-${saveStatus}`}>{SAVE_LABELS[saveStatus]}</small>
        )}
      </div>
      <nav className="titlebar-actions" aria-label="보기 및 설정">
        <button
          aria-label="문서 패널 전환"
          title="문서 패널 (Ctrl+B)"
          onClick={onToggleSidebar}
        >
          ◧
        </button>
        <button
          aria-label="사고 도우미 패널 전환"
          title="사고 도우미 패널 (Ctrl+Alt+B)"
          onClick={onToggleAssistant}
        >
          ◨
        </button>
        <button aria-label="설정 열기" title="설정 (Ctrl+,)" onClick={onSettings}>
          설정
        </button>
      </nav>
    </header>
  );
}
