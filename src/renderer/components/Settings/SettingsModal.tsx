import { useState } from 'react';
import type { AppSettings, SettingsPatch } from '../../../shared/contracts';
import {
  AI_PROVIDER_CATALOG,
  AI_PROVIDER_MAP,
  type AIProviderId,
} from '../../../shared/aiProviders';

interface SettingsModalProps {
  settings: AppSettings;
  onClose: () => void;
  onSave: (patch: SettingsPatch) => Promise<void>;
  onSelectWorkspace: () => Promise<string | null>;
  onSaveApiKey: (key: string) => Promise<void>;
  onDeleteApiKey: () => Promise<void>;
  onTestConnection: () => Promise<string>;
}

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
  const selectedProvider = AI_PROVIDER_MAP[draft.ai.providerId] ?? AI_PROVIDER_MAP.custom;

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

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span className="eyebrow">PREFERENCES</span>
            <h2 id="settings-title">설정</h2>
          </div>
          <button aria-label="설정 닫기" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="settings-content">
          <fieldset>
            <legend>일반</legend>
            <div className="workspace-setting">
              <span>작업폴더</span>
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
                    setMessage(
                      '작업폴더를 변경했습니다. 선택한 폴더는 다음 실행에도 유지됩니다.',
                    );
                  })
                }
              >
                다른 폴더 선택
              </button>
              <small>새 설치의 기본값은 프로그램 설치 폴더의 workspaces입니다.</small>
            </div>
            <label>
              테마
              <select
                value={draft.theme}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    theme: event.target.value as AppSettings['theme'],
                  })
                }
              >
                <option value="system">시스템</option>
                <option value="light">밝게</option>
                <option value="dark">어둡게</option>
              </select>
            </label>
            <label>
              글자 크기
              <input
                type="number"
                min={12}
                max={24}
                value={draft.fontSize}
                onChange={(event) =>
                  setDraft({ ...draft, fontSize: Number(event.target.value) })
                }
              />
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={draft.autoSave}
                onChange={(event) =>
                  setDraft({ ...draft, autoSave: event.target.checked })
                }
              />
              자동 저장
            </label>
            <label>
              자동 저장 지연(ms)
              <input
                type="number"
                min={300}
                max={10000}
                value={draft.autoSaveDelay}
                onChange={(event) =>
                  setDraft({ ...draft, autoSaveDelay: Number(event.target.value) })
                }
              />
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={draft.reopenLastDocument}
                onChange={(event) =>
                  setDraft({ ...draft, reopenLastDocument: event.target.checked })
                }
              />
              시작할 때 마지막 문서 열기
            </label>
          </fieldset>
          <fieldset>
            <legend>AI 연결</legend>
            <p className="privacy-note">
              AI 분석 버튼을 누를 때만 선택 영역 또는 현재 문서가 설정한 API로 전송됩니다.
            </p>
            <label>
              API 이름
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
              AI 제공자
              <select
                value={draft.ai.providerId}
                onChange={(event) => {
                  const providerId = event.target.value as AIProviderId;
                  const provider = AI_PROVIDER_MAP[providerId];
                  setDraft({
                    ...draft,
                    ai: {
                      ...draft.ai,
                      providerId,
                      providerName: provider.name,
                      baseUrl: provider.baseUrl,
                      model: provider.model,
                    },
                  });
                }}
              >
                {AI_PROVIDER_CATALOG.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Base URL
              <input
                value={draft.ai.baseUrl}
                onChange={(event) =>
                  setDraft({ ...draft, ai: { ...draft.ai, baseUrl: event.target.value } })
                }
              />
            </label>
            <label>
              모델
              <input
                value={draft.ai.model}
                onChange={(event) =>
                  setDraft({ ...draft, ai: { ...draft.ai, model: event.target.value } })
                }
              />
            </label>
            <label>
              요청 제한 시간(ms)
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
            <label>
              API 키
              <input
                type="password"
                autoComplete="off"
                value={apiKey}
                placeholder={settings.ai.hasApiKey ? '저장된 키 ••••••••' : 'API 키 입력'}
                onChange={(event) => setApiKey(event.target.value)}
                disabled={!selectedProvider.requiresApiKey}
              />
            </label>
            <div className="settings-inline-actions">
              <button
                disabled={busy || !selectedProvider.requiresApiKey || !apiKey.trim()}
                onClick={() =>
                  void execute(async () => {
                    await onSaveApiKey(apiKey);
                    setApiKey('');
                    setMessage('API 키를 암호화해 저장했습니다.');
                  })
                }
              >
                키 저장
              </button>
              <button
                disabled={busy || !settings.ai.hasApiKey}
                onClick={() =>
                  void execute(async () => {
                    await onDeleteApiKey();
                    setMessage('저장된 API 키를 삭제했습니다.');
                  })
                }
              >
                키 삭제
              </button>
              <button
                disabled={busy}
                onClick={() =>
                  void execute(async () => {
                    await onSave({
                      ai: {
                        providerId: draft.ai.providerId,
                        providerName: draft.ai.providerName,
                        baseUrl: draft.ai.baseUrl,
                        model: draft.ai.model,
                        timeoutMs: draft.ai.timeoutMs,
                      },
                    });
                    setMessage(await onTestConnection());
                  })
                }
              >
                연결 테스트
              </button>
            </div>
          </fieldset>
        </div>
        {message && <div className="settings-message">{message}</div>}
        <footer>
          <button onClick={onClose}>취소</button>
          <button
            className="primary"
            disabled={busy}
            onClick={() =>
              void execute(async () => {
                await onSave({
                  reopenLastDocument: draft.reopenLastDocument,
                  autoSave: draft.autoSave,
                  autoSaveDelay: draft.autoSaveDelay,
                  theme: draft.theme,
                  fontSize: draft.fontSize,
                  ai: {
                    providerId: draft.ai.providerId,
                    providerName: draft.ai.providerName,
                    baseUrl: draft.ai.baseUrl,
                    model: draft.ai.model,
                    timeoutMs: draft.ai.timeoutMs,
                  },
                });
                onClose();
              })
            }
          >
            저장
          </button>
        </footer>
      </section>
    </div>
  );
}
