import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AIStage,
  EditorFontFamily,
  FileDocument,
  FileSummary,
  InterfaceFontFamily,
  SettingsPatch,
  SupportedExtension,
} from '../shared/contracts';
import { AssistantPanel } from './components/AssistantPanel/AssistantPanel';
import { Editor } from './components/Editor/Editor';
import { SettingsModal } from './components/Settings/SettingsModal';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Toolbar } from './components/Toolbar/Toolbar';
import { useAppDispatch, useAppState } from './state/appStore';
import { formatError } from './utils/formatting';

const STAGE_NAMES: Record<AIStage, string> = {
  organize: '체계화',
  structure: '구조화',
  validate: '개념검증',
  realize: '현실화',
  prompt: '최종 프롬프트',
};

const INTERFACE_FONT_STACKS: Record<InterfaceFontFamily, string> = {
  system: "'Segoe UI Variable', 'Pretendard', 'Noto Sans KR', sans-serif",
  sans: "'Pretendard', 'Noto Sans KR', 'Malgun Gothic', sans-serif",
  serif: "'Noto Serif KR', 'Malgun Myeongjo', serif",
};

const EDITOR_FONT_STACKS: Record<EditorFontFamily, string> = {
  ...INTERFACE_FONT_STACKS,
  monospace: "'Cascadia Code', 'D2Coding', Consolas, monospace",
};

export function App(): React.JSX.Element {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [findOpen, setFindOpen] = useState(false);

  const refreshFiles = useCallback(async (): Promise<void> => {
    if (!state.settings?.workspacePath) {
      dispatch({ type: 'files', files: [] });
      return;
    }
    try {
      dispatch({ type: 'files', files: await window.thinkframe.workspace.listFiles() });
    } catch (error) {
      dispatch({ type: 'error', message: formatError(error) });
    }
  }, [dispatch, state.settings?.workspacePath]);

  const openDocument = useCallback(
    async (relativePath: string): Promise<void> => {
      try {
        const document = await window.thinkframe.files.read(relativePath);
        dispatch({ type: 'document', document });
      } catch (error) {
        dispatch({ type: 'error', message: formatError(error) });
        await refreshFiles();
      }
    },
    [dispatch, refreshFiles],
  );

  useEffect(() => {
    const initialize = async (): Promise<void> => {
      try {
        const [settings, appInfo] = await Promise.all([
          window.thinkframe.settings.get(),
          window.thinkframe.app.getInfo(),
        ]);
        dispatch({ type: 'initialized', settings, appInfo });
        if (settings.workspacePath) {
          const files = await window.thinkframe.workspace.listFiles();
          dispatch({ type: 'files', files });
          if (
            settings.reopenLastDocument &&
            settings.lastDocument &&
            files.some((file) => file.relativePath === settings.lastDocument)
          ) {
            const document = await window.thinkframe.files.read(settings.lastDocument);
            dispatch({ type: 'document', document });
          }
        }
      } catch (error) {
        dispatch({ type: 'error', message: formatError(error) });
      }
    };
    void initialize();
  }, [dispatch]);

  useEffect(() => {
    if (!state.settings) return;
    document.documentElement.dataset.theme = state.settings.theme;
    document.documentElement.style.colorScheme =
      state.settings.theme === 'system' ? 'light dark' : state.settings.theme;
    document.documentElement.style.setProperty(
      '--interface-font-size',
      `${state.settings.interfaceFontSize}px`,
    );
    document.documentElement.style.setProperty(
      '--font-interface',
      INTERFACE_FONT_STACKS[state.settings.interfaceFontFamily],
    );
    document.documentElement.style.setProperty(
      '--font-editor',
      EDITOR_FONT_STACKS[state.settings.editorFontFamily],
    );
  }, [state.settings]);

  const saveDocument = useCallback(async (): Promise<boolean> => {
    if (!state.document || state.content === state.savedContent) return true;
    dispatch({ type: 'saveStatus', status: 'saving' });
    try {
      const result = await window.thinkframe.files.write({
        relativePath: state.document.relativePath,
        content: state.content,
        expectedModifiedAt: state.document.modifiedAt,
      });
      if (result.status === 'conflict') {
        dispatch({ type: 'saveStatus', status: 'conflict' });
        dispatch({
          type: 'error',
          message:
            '이 문서가 다른 프로그램에서 변경되었습니다. 현재 내용을 보존했습니다. 다시 열어 변경 사항을 확인해 주세요.',
        });
        return false;
      }
      dispatch({
        type: 'saved',
        content: state.content,
        modifiedAt: result.modifiedAt,
      });
      await refreshFiles();
      return true;
    } catch (error) {
      dispatch({ type: 'saveStatus', status: 'error' });
      dispatch({ type: 'error', message: formatError(error) });
      return false;
    }
  }, [dispatch, refreshFiles, state.content, state.document, state.savedContent]);

  useEffect(() => {
    if (
      !state.settings?.autoSave ||
      !state.document ||
      state.content === state.savedContent
    ) {
      return;
    }
    const timer = window.setTimeout(() => {
      void saveDocument();
    }, state.settings.autoSaveDelay);
    return () => window.clearTimeout(timer);
  }, [
    saveDocument,
    state.content,
    state.document,
    state.savedContent,
    state.settings?.autoSave,
    state.settings?.autoSaveDelay,
  ]);

  const selectWorkspace = useCallback(async (): Promise<string | null> => {
    if (!(await saveDocument())) return null;
    try {
      const workspacePath = await window.thinkframe.workspace.select();
      if (!workspacePath) return null;
      const [settings, files] = await Promise.all([
        window.thinkframe.settings.get(),
        window.thinkframe.workspace.listFiles(),
      ]);
      dispatch({ type: 'settings', settings });
      dispatch({ type: 'files', files });
      dispatch({ type: 'document', document: null });
      return workspacePath;
    } catch (error) {
      dispatch({ type: 'error', message: formatError(error) });
      return null;
    }
  }, [dispatch, saveDocument]);

  const createDocument = useCallback(
    async (
      content = '',
      extension: SupportedExtension = '.md',
    ): Promise<FileDocument | null> => {
      if (!state.settings?.workspacePath) {
        if (!(await selectWorkspace())) return null;
      }
      if (!(await saveDocument())) return null;
      try {
        const document = await window.thinkframe.files.create({
          extension,
          content,
        });
        dispatch({ type: 'document', document });
        await refreshFiles();
        window.setTimeout(() => textareaRef.current?.focus(), 0);
        return document;
      } catch (error) {
        dispatch({ type: 'error', message: formatError(error) });
        return null;
      }
    },
    [
      dispatch,
      refreshFiles,
      saveDocument,
      selectWorkspace,
      state.settings?.workspacePath,
    ],
  );

  const handleOpenDocument = useCallback(
    async (relativePath: string): Promise<void> => {
      if (state.document?.relativePath === relativePath) return;
      if (!(await saveDocument())) return;
      await openDocument(relativePath);
    },
    [openDocument, saveDocument, state.document?.relativePath],
  );

  const renameDocument = async (file: FileSummary): Promise<void> => {
    const name = window.prompt('새 문서 이름', file.name);
    if (!name || name === file.name) return;
    if (!(await saveDocument())) return;
    try {
      const renamed = await window.thinkframe.files.rename(file.relativePath, name);
      if (state.document?.relativePath === file.relativePath) {
        dispatch({ type: 'document', document: renamed });
      }
      await refreshFiles();
    } catch (error) {
      dispatch({ type: 'error', message: formatError(error) });
    }
  };

  const duplicateDocument = async (file: FileSummary): Promise<void> => {
    try {
      const duplicate = await window.thinkframe.files.duplicate(file.relativePath);
      dispatch({ type: 'document', document: duplicate });
      await refreshFiles();
    } catch (error) {
      dispatch({ type: 'error', message: formatError(error) });
    }
  };

  const saveDocumentAs = async (file: FileSummary): Promise<void> => {
    if (!(await saveDocument())) return;
    const requestedName = window.prompt('다른 이름으로 저장', `복사본 ${file.name}`);
    if (!requestedName) return;
    try {
      const source =
        state.document?.relativePath === file.relativePath
          ? { ...state.document, content: state.content }
          : await window.thinkframe.files.read(file.relativePath);
      const created = await window.thinkframe.files.create({
        name: requestedName,
        extension: file.extension,
        content: source.content,
      });
      dispatch({ type: 'document', document: created });
      await refreshFiles();
    } catch (error) {
      dispatch({ type: 'error', message: formatError(error) });
    }
  };

  const removeDocument = async (file: FileSummary): Promise<void> => {
    if (!window.confirm(`"${file.name}" 문서를 휴지통으로 이동할까요?`)) return;
    try {
      await window.thinkframe.files.remove(file.relativePath);
      if (state.document?.relativePath === file.relativePath) {
        dispatch({ type: 'document', document: null });
      }
      await refreshFiles();
    } catch (error) {
      dispatch({ type: 'error', message: formatError(error) });
    }
  };

  const analysisText = useMemo(() => {
    if (!state.document) return '';
    const { start, end } = state.selection;
    return end > start ? state.content.slice(start, end) : state.content;
  }, [state.content, state.document, state.selection]);

  const scopeLabel = useMemo(() => {
    if (!state.document) return '';
    const selectedLength = Math.max(0, state.selection.end - state.selection.start);
    return selectedLength > 0
      ? `선택 영역: ${selectedLength.toLocaleString('ko-KR')}자`
      : `문서 전체: ${state.content.length.toLocaleString('ko-KR')}자`;
  }, [state.content.length, state.document, state.selection]);

  const runAnalysis = useCallback(
    async (stageOverride?: AIStage): Promise<void> => {
      if (!analysisText.trim()) {
        dispatch({ type: 'error', message: '분석할 텍스트가 없습니다.' });
        return;
      }
      const requestId = crypto.randomUUID();
      const stage = stageOverride ?? state.stage;
      dispatch({ type: 'stage', stage });
      dispatch({ type: 'analysisStarted', requestId });
      try {
        const previous =
          state.usePreviousResult && state.result
            ? `\n\n이전 분석 결과 참고:\n---\n${state.result.rawText}\n---`
            : '';
        const result = await window.thinkframe.ai.analyze({
          requestId,
          stage,
          content: `${analysisText}${previous}`,
          instructions: state.instructions,
        });
        dispatch({ type: 'analysisFinished', result });
      } catch (error) {
        dispatch({ type: 'analysisStopped' });
        dispatch({ type: 'error', message: formatError(error) });
      }
    },
    [
      analysisText,
      dispatch,
      state.instructions,
      state.result,
      state.stage,
      state.usePreviousResult,
    ],
  );

  const cancelAnalysis = async (): Promise<void> => {
    if (!state.requestId) return;
    await window.thinkframe.ai.cancel(state.requestId);
  };

  const appendResult = (mode: 'append' | 'insert'): void => {
    if (!state.result || !state.document) return;
    const block = `\n\n---\n\n${state.result.rawText}\n`;
    if (mode === 'append') {
      dispatch({ type: 'content', content: `${state.content.trimEnd()}${block}` });
      return;
    }
    const position = state.selection.end;
    dispatch({
      type: 'content',
      content: `${state.content.slice(0, position)}${block}${state.content.slice(position)}`,
    });
  };

  const saveResultAsNew = async (): Promise<void> => {
    if (!state.result || !state.settings?.workspacePath) return;
    try {
      const date = new Date().toISOString().slice(0, 10);
      const document = await window.thinkframe.files.create({
        name: `${STAGE_NAMES[state.result.stage]} ${date}.md`,
        extension: '.md',
        content: state.result.rawText,
      });
      dispatch({ type: 'document', document });
      await refreshFiles();
    } catch (error) {
      dispatch({ type: 'error', message: formatError(error) });
    }
  };

  const updateSettings = async (patch: SettingsPatch): Promise<void> => {
    const settings = await window.thinkframe.settings.update(patch);
    dispatch({ type: 'settings', settings });
  };

  const refreshSettings = async (): Promise<void> => {
    dispatch({ type: 'settings', settings: await window.thinkframe.settings.get() });
  };

  useEffect(() => {
    const preventUnsavedClose = (event: BeforeUnloadEvent): void => {
      if (state.document && state.content !== state.savedContent) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', preventUnsavedClose);
    return () => window.removeEventListener('beforeunload', preventUnsavedClose);
  }, [state.content, state.document, state.savedContent]);

  const handleKeyboard = (event: React.KeyboardEvent): void => {
    if (!event.ctrlKey) return;
    const key = event.key.toLowerCase();
    if (event.altKey && key === 'b') {
      event.preventDefault();
      dispatch({ type: 'toggleAssistant' });
      return;
    }
    if (event.shiftKey && key === 'p') {
      event.preventDefault();
      void runAnalysis('prompt');
      return;
    }
    if (event.shiftKey && key === 'n') {
      event.preventDefault();
      void createDocument('', '.txt');
      return;
    }
    const handlers: Record<string, () => void> = {
      n: () => void createDocument(),
      o: () => void selectWorkspace(),
      s: () => void saveDocument(),
      ',': () => dispatch({ type: 'settingsOpen', value: true }),
      b: () => dispatch({ type: 'toggleSidebar' }),
      f: () => setFindOpen(true),
      '1': () => dispatch({ type: 'stage', stage: 'organize' }),
      '2': () => dispatch({ type: 'stage', stage: 'structure' }),
      '3': () => dispatch({ type: 'stage', stage: 'validate' }),
      '4': () => dispatch({ type: 'stage', stage: 'realize' }),
    };
    if (handlers[key]) {
      event.preventDefault();
      handlers[key]();
    }
  };

  return (
    <div className="app-shell" onKeyDownCapture={handleKeyboard}>
      <Toolbar
        documentName={state.document?.name ?? ''}
        version={state.appInfo?.version ?? null}
        saveStatus={state.saveStatus}
        onToggleSidebar={() => dispatch({ type: 'toggleSidebar' })}
        onToggleAssistant={() => dispatch({ type: 'toggleAssistant' })}
        onSettings={() => dispatch({ type: 'settingsOpen', value: true })}
      />
      {state.error && (
        <div className="error-banner" role="alert">
          <span>{state.error}</span>
          <button
            aria-label="오류 닫기"
            onClick={() => dispatch({ type: 'error', message: null })}
          >
            ×
          </button>
        </div>
      )}
      <div
        className={`workspace ${!state.sidebarOpen ? 'sidebar-closed' : ''} ${!state.assistantOpen ? 'assistant-closed' : ''}`}
      >
        {state.sidebarOpen && (
          <Sidebar
            workspacePath={state.settings?.workspacePath ?? null}
            files={state.files}
            activePath={state.document?.relativePath}
            onSelectWorkspace={() => void selectWorkspace()}
            onCreate={(extension) => void createDocument('', extension)}
            onOpen={(path) => void handleOpenDocument(path)}
            onRename={(file) => void renameDocument(file)}
            onSaveAs={(file) => void saveDocumentAs(file)}
            onDuplicate={(file) => void duplicateDocument(file)}
            onRemove={(file) => void removeDocument(file)}
            onReveal={(file) => void window.thinkframe.files.reveal(file.relativePath)}
          />
        )}
        <Editor
          documentName={state.document?.name ?? ''}
          content={state.content}
          disabled={!state.document}
          fontSize={state.settings?.fontSize ?? 18}
          lineHeight={state.settings?.editorLineHeight ?? 1.75}
          readableLineLength={state.settings?.readableLineLength ?? true}
          spellCheck={state.settings?.spellCheck ?? true}
          findOpen={findOpen}
          cursorPosition={state.selection.end}
          textareaRef={textareaRef}
          onChange={(content) => dispatch({ type: 'content', content })}
          onSelect={(start, end) => dispatch({ type: 'selection', start, end })}
          onFindOpen={setFindOpen}
          onSelectWorkspace={() => void selectWorkspace()}
          onCreate={(extension) => void createDocument('', extension)}
        />
        {state.assistantOpen && (
          <AssistantPanel
            stage={state.stage}
            result={state.result}
            loading={Boolean(state.requestId)}
            scopeLabel={scopeLabel}
            instructions={state.instructions}
            usePreviousResult={state.usePreviousResult}
            onStage={(stage) => dispatch({ type: 'stage', stage })}
            onAnalyze={() => void runAnalysis()}
            onCancel={() => void cancelAnalysis()}
            onInstructions={(value) => dispatch({ type: 'instructions', value })}
            onUsePreviousResult={(value) =>
              dispatch({ type: 'usePreviousResult', value })
            }
            onCopy={() => {
              if (state.result)
                void window.thinkframe.external.copy(state.result.rawText);
            }}
            onAppend={() => appendResult('append')}
            onInsert={() => appendResult('insert')}
            onSaveNew={() => void saveResultAsNew()}
            onOpenAI={(key) => {
              if (state.result) {
                void window.thinkframe.external.copyAndOpen(key, state.result.rawText);
              }
            }}
          />
        )}
      </div>
      {state.settingsOpen && state.settings && (
        <SettingsModal
          settings={state.settings}
          onClose={() => dispatch({ type: 'settingsOpen', value: false })}
          onSave={updateSettings}
          onSelectWorkspace={selectWorkspace}
          onSaveApiKey={async (providerId, key) => {
            await window.thinkframe.settings.saveApiKey(providerId, key);
            await refreshSettings();
          }}
          onDeleteApiKey={async (providerId) => {
            await window.thinkframe.settings.deleteApiKey(providerId);
            await refreshSettings();
          }}
          onTestConnection={async () => {
            const result = await window.thinkframe.settings.testAIConnection();
            return result.message;
          }}
        />
      )}
    </div>
  );
}
