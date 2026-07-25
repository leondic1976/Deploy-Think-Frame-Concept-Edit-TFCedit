import { useState } from 'react';
import {
  AI_PROVIDER_CATALOG,
  AI_PROVIDER_MAP,
  type AIProviderId,
} from '../../../shared/aiProviders';
import { DEFAULT_SETTINGS } from '../../../shared/constants';
import type { AppSettings, SettingsPatch } from '../../../shared/contracts';

interface SettingsModalProps {
  settings: AppSettings;
  onClose: () => void;
  onSave: (patch: SettingsPatch) => Promise<void>;
  onSelectWorkspace: () => Promise<string | null>;
  onSaveApiKey: (providerId: AIProviderId, key: string) => Promise<void>;
  onDeleteApiKey: (providerId: AIProviderId) => Promise<void>;
  onTestConnection: () => Promise<string>;
}

const FREE_PROVIDER_IDS = [
  'gemini',
  'groq',
  'openrouter-free',
  'ollama',
] satisfies AIProviderId[];

export function SettingsModal({
  settings,
  onClose,
  onSave,
  onSelectWorkspace,
  onSaveApiKey,
  onDeleteApiKey,
  onTestConnection,
}: SettingsModalProps): React.JSX.Element {
  const [draft, setDraft] = useState(settings);
  const [apiKey, setApiKey] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [knownKeyStatus, setKnownKeyStatus] = useState<
    Partial<Record<AIProviderId, boolean>>
  >({ [settings.ai.providerId]: settings.ai.hasApiKey });
  const selectedProvider = AI_PROVIDER_MAP[draft.ai.providerId] ?? AI_PROVIDER_MAP.custom;
  const selectedHasApiKey = knownKeyStatus[draft.ai.providerId] ?? false;

  const execute = async (operation: () => Promise<void>): Promise<void> => {
    setBusy(true);
    setMessage('');
    try {
      await operation();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '작업에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const selectProvider = (providerId: AIProviderId): void => {
    const provider = AI_PROVIDER_MAP[providerId];
    setApiKey('');
    setDraft((current) => ({
      ...current,
      ai: {
        ...current.ai,
        providerId,
        providerName: provider.name,
        baseUrl: provider.baseUrl,
        model: provider.model,
      },
    }));
  };

  const appearancePatch = (): SettingsPatch => ({
    reopenLastDocument: draft.reopenLastDocument,
    autoSave: draft.autoSave,
    autoSaveDelay: draft.autoSaveDelay,
    theme: draft.theme,
    interfaceFontSize: draft.interfaceFontSize,
    interfaceFontFamily: draft.interfaceFontFamily,
    fontSize: draft.fontSize,
    editorFontFamily: draft.editorFontFamily,
    editorLineHeight: draft.editorLineHeight,
    readableLineLength: draft.readableLineLength,
    spellCheck: draft.spellCheck,
    ai: {
      providerId: draft.ai.providerId,
      providerName: draft.ai.providerName,
      baseUrl: draft.ai.baseUrl,
      model: draft.ai.model,
      timeoutMs: draft.ai.timeoutMs,
    },
  });

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="settings-header">
          <div>
            <span className="eyebrow">PREFERENCES</span>
            <h2 id="settings-title">ThinkFrame 설정</h2>
            <p>화면과 글쓰기 환경을 내 눈과 작업 방식에 맞춥니다.</p>
          </div>
          <button className="icon-button" aria-label="설정 닫기" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="settings-content">
          <fieldset>
            <div className="settings-section-heading">
              <div>
                <legend>화면 모양</legend>
                <p>인터페이스와 문서의 글꼴을 각각 설정합니다.</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    theme: DEFAULT_SETTINGS.theme,
                    interfaceFontSize: DEFAULT_SETTINGS.interfaceFontSize,
                    interfaceFontFamily: DEFAULT_SETTINGS.interfaceFontFamily,
                    fontSize: DEFAULT_SETTINGS.fontSize,
                    editorFontFamily: DEFAULT_SETTINGS.editorFontFamily,
                    editorLineHeight: DEFAULT_SETTINGS.editorLineHeight,
                    readableLineLength: DEFAULT_SETTINGS.readableLineLength,
                    spellCheck: DEFAULT_SETTINGS.spellCheck,
                  }))
                }
              >
                기본값 복원
              </button>
            </div>

            <div className="settings-grid">
              <label>
                <span>테마</span>
                <select
                  value={draft.theme}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      theme: event.target.value as AppSettings['theme'],
                    })
                  }
                >
                  <option value="system">시스템 설정</option>
                  <option value="light">밝은 화면</option>
                  <option value="dark">어두운 화면</option>
                </select>
              </label>
              <label>
                <span>인터페이스 글꼴</span>
                <select
                  value={draft.interfaceFontFamily}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      interfaceFontFamily: event.target
                        .value as AppSettings['interfaceFontFamily'],
                    })
                  }
                >
                  <option value="system">시스템 기본</option>
                  <option value="sans">고딕</option>
                  <option value="serif">명조</option>
                </select>
              </label>
            </div>

            <label className="range-setting">
              <span>
                인터페이스 크기
                <output>{draft.interfaceFontSize}px</output>
              </span>
              <input
                type="range"
                min={12}
                max={20}
                value={draft.interfaceFontSize}
                onChange={(event) =>
                  setDraft({ ...draft, interfaceFontSize: Number(event.target.value) })
                }
              />
              <small>도구막대, 파일 목록, 설정과 AI 패널의 글자 크기입니다.</small>
            </label>

            <div className="settings-grid">
              <label>
                <span>문서 글꼴</span>
                <select
                  value={draft.editorFontFamily}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      editorFontFamily: event.target
                        .value as AppSettings['editorFontFamily'],
                    })
                  }
                >
                  <option value="system">시스템 기본</option>
                  <option value="sans">고딕</option>
                  <option value="serif">명조</option>
                  <option value="monospace">고정폭</option>
                </select>
              </label>
              <label>
                <span>줄 간격</span>
                <select
                  value={draft.editorLineHeight}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      editorLineHeight: Number(event.target.value),
                    })
                  }
                >
                  <option value={1.5}>좁게 · 1.5</option>
                  <option value={1.75}>보통 · 1.75</option>
                  <option value={2}>넓게 · 2.0</option>
                </select>
              </label>
            </div>

            <label className="range-setting">
              <span>
                문서 본문 크기
                <output>{draft.fontSize}px</output>
              </span>
              <input
                type="range"
                min={12}
                max={36}
                value={draft.fontSize}
                onChange={(event) =>
                  setDraft({ ...draft, fontSize: Number(event.target.value) })
                }
              />
            </label>

            <div
              className="font-preview"
              style={{
                fontSize: Math.min(draft.fontSize, 24),
                lineHeight: draft.editorLineHeight,
              }}
            >
              생각을 선명하게 쓰면 다음 행동도 선명해집니다.
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={draft.readableLineLength}
                onChange={(event) =>
                  setDraft({ ...draft, readableLineLength: event.target.checked })
                }
              />
              <span>
                읽기 좋은 줄 너비
                <small>긴 화면에서도 본문 폭을 제한해 읽기 편하게 합니다.</small>
              </span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={draft.spellCheck}
                onChange={(event) =>
                  setDraft({ ...draft, spellCheck: event.target.checked })
                }
              />
              <span>운영체제 맞춤법 검사</span>
            </label>
          </fieldset>

          <fieldset>
            <div className="settings-section-heading">
              <div>
                <legend>파일과 저장</legend>
                <p>로컬 작업공간과 자동 저장 동작을 관리합니다.</p>
              </div>
            </div>
            <div className="workspace-setting">
              <span>현재 작업폴더</span>
              <code title={draft.workspacePath ?? ''}>
                {draft.workspacePath ?? '설치 폴더의 workspaces'}
              </code>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void execute(async () => {
                    const workspacePath = await onSelectWorkspace();
                    if (!workspacePath) return;
                    setDraft((current) => ({ ...current, workspacePath }));
                    setMessage('작업폴더를 변경했습니다.');
                  })
                }
              >
                폴더 변경
              </button>
            </div>
            <div className="settings-grid">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={draft.autoSave}
                  onChange={(event) =>
                    setDraft({ ...draft, autoSave: event.target.checked })
                  }
                />
                <span>자동 저장</span>
              </label>
              <label className="compact-setting">
                <span>저장 대기 시간</span>
                <select
                  value={draft.autoSaveDelay}
                  disabled={!draft.autoSave}
                  onChange={(event) =>
                    setDraft({ ...draft, autoSaveDelay: Number(event.target.value) })
                  }
                >
                  <option value={500}>0.5초</option>
                  <option value={800}>0.8초</option>
                  <option value={1500}>1.5초</option>
                  <option value={3000}>3초</option>
                </select>
              </label>
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={draft.reopenLastDocument}
                onChange={(event) =>
                  setDraft({ ...draft, reopenLastDocument: event.target.checked })
                }
              />
              <span>시작할 때 마지막 문서 다시 열기</span>
            </label>
          </fieldset>

          <fieldset>
            <div className="settings-section-heading">
              <div>
                <legend>AI 연결</legend>
                <p>
                  분석을 실행할 때만 선택 영역 또는 현재 문서를 설정한 API로 전송합니다.
                </p>
              </div>
              {selectedProvider.freeTier && (
                <span className="free-badge">무료 선택지</span>
              )}
            </div>

            <div className="free-provider-grid">
              {FREE_PROVIDER_IDS.map((providerId) => {
                const provider = AI_PROVIDER_MAP[providerId];
                return (
                  <button
                    type="button"
                    key={provider.id}
                    className={provider.id === draft.ai.providerId ? 'selected' : ''}
                    onClick={() => selectProvider(provider.id)}
                  >
                    <strong>{provider.name}</strong>
                    <span>
                      {provider.requiresApiKey ? '무료 API 한도' : '내 PC에서 무료'}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="free-tier-note">
              무료 한도와 제공 모델은 각 서비스 정책에 따라 바뀔 수 있습니다. ThinkFrame은
              별도 이용료를 부과하지 않으며 사용자의 키를 운영체제 보안 저장소에 암호화해
              보관합니다.
            </p>

            <div className="settings-grid">
              <label>
                <span>AI 제공자</span>
                <select
                  value={draft.ai.providerId}
                  onChange={(event) => selectProvider(event.target.value as AIProviderId)}
                >
                  {AI_PROVIDER_CATALOG.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>표시 이름</span>
                <input
                  value={draft.ai.providerName}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      ai: { ...draft.ai, providerName: event.target.value },
                    })
                  }
                />
              </label>
              <label>
                <span>Base URL</span>
                <input
                  value={draft.ai.baseUrl}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      ai: { ...draft.ai, baseUrl: event.target.value },
                    })
                  }
                />
              </label>
              <label>
                <span>모델</span>
                <input
                  value={draft.ai.model}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      ai: { ...draft.ai, model: event.target.value },
                    })
                  }
                />
              </label>
            </div>

            {selectedProvider.freeTier && (
              <div className="provider-help">
                <span>{selectedProvider.freeTier}</span>
                {selectedProvider.setupUrl && (
                  <a href={selectedProvider.setupUrl} target="_blank" rel="noreferrer">
                    {selectedProvider.requiresApiKey
                      ? '무료 키 만들기 ↗'
                      : 'Ollama 설치 ↗'}
                  </a>
                )}
              </div>
            )}

            <div className="api-key-row">
              <label>
                <span>
                  API 키
                  {selectedProvider.requiresApiKey && (
                    <em className={selectedHasApiKey ? 'is-saved' : ''}>
                      {selectedHasApiKey ? '저장됨' : '필요'}
                    </em>
                  )}
                </span>
                <input
                  type="password"
                  autoComplete="off"
                  value={apiKey}
                  placeholder={selectedHasApiKey ? '저장된 키 ••••••••' : 'API 키 입력'}
                  onChange={(event) => setApiKey(event.target.value)}
                  disabled={!selectedProvider.requiresApiKey}
                />
              </label>
              <button
                type="button"
                disabled={busy || !selectedProvider.requiresApiKey || !apiKey.trim()}
                onClick={() =>
                  void execute(async () => {
                    await onSaveApiKey(draft.ai.providerId, apiKey);
                    setKnownKeyStatus((current) => ({
                      ...current,
                      [draft.ai.providerId]: true,
                    }));
                    setApiKey('');
                    setMessage(
                      `${selectedProvider.name} API 키를 암호화해 저장했습니다.`,
                    );
                  })
                }
              >
                키 저장
              </button>
              <button
                type="button"
                disabled={busy || !selectedHasApiKey}
                onClick={() =>
                  void execute(async () => {
                    await onDeleteApiKey(draft.ai.providerId);
                    setKnownKeyStatus((current) => ({
                      ...current,
                      [draft.ai.providerId]: false,
                    }));
                    setMessage(`${selectedProvider.name} API 키를 삭제했습니다.`);
                  })
                }
              >
                삭제
              </button>
            </div>

            <details className="advanced-settings">
              <summary>고급 AI 설정</summary>
              <label>
                <span>요청 제한 시간(ms)</span>
                <input
                  type="number"
                  min={5000}
                  max={180000}
                  value={draft.ai.timeoutMs}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      ai: { ...draft.ai, timeoutMs: Number(event.target.value) },
                    })
                  }
                />
              </label>
            </details>

            <button
              type="button"
              className="connection-test"
              disabled={busy}
              onClick={() =>
                void execute(async () => {
                  await onSave({ ai: appearancePatch().ai });
                  setMessage(await onTestConnection());
                })
              }
            >
              선택한 AI 연결 테스트
            </button>
          </fieldset>
        </div>

        {message && (
          <div className="settings-message" role="status">
            {message}
          </div>
        )}
        <footer className="settings-footer">
          <button type="button" onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className="primary"
            disabled={busy}
            onClick={() =>
              void execute(async () => {
                await onSave(appearancePatch());
                onClose();
              })
            }
          >
            설정 저장
          </button>
        </footer>
      </section>
    </div>
  );
}
