import {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  useContext,
  useReducer,
} from 'react';
import type {
  AIStage,
  AppInfo,
  AppSettings,
  AssistantResult,
  FileDocument,
  FileSummary,
} from '../../shared/contracts';

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'conflict' | 'error';

export interface AppState {
  appInfo: AppInfo | null;
  settings: AppSettings | null;
  files: FileSummary[];
  document: FileDocument | null;
  content: string;
  savedContent: string;
  selection: { start: number; end: number };
  saveStatus: SaveStatus;
  error: string | null;
  result: AssistantResult | null;
  stage: AIStage;
  requestId: string | null;
  instructions: string;
  usePreviousResult: boolean;
  sidebarOpen: boolean;
  assistantOpen: boolean;
  settingsOpen: boolean;
}

export const initialState: AppState = {
  appInfo: null,
  settings: null,
  files: [],
  document: null,
  content: '',
  savedContent: '',
  selection: { start: 0, end: 0 },
  saveStatus: 'idle',
  error: null,
  result: null,
  stage: 'organize',
  requestId: null,
  instructions: '',
  usePreviousResult: false,
  sidebarOpen: true,
  assistantOpen: true,
  settingsOpen: false,
};

export type AppAction =
  | { type: 'initialized'; settings: AppSettings; appInfo: AppInfo }
  | { type: 'settings'; settings: AppSettings }
  | { type: 'files'; files: FileSummary[] }
  | { type: 'document'; document: FileDocument | null }
  | { type: 'content'; content: string }
  | { type: 'selection'; start: number; end: number }
  | { type: 'saveStatus'; status: SaveStatus }
  | { type: 'saved'; content: string; modifiedAt: number }
  | { type: 'error'; message: string | null }
  | { type: 'stage'; stage: AIStage }
  | { type: 'analysisStarted'; requestId: string }
  | { type: 'analysisFinished'; result: AssistantResult }
  | { type: 'analysisStopped' }
  | { type: 'instructions'; value: string }
  | { type: 'usePreviousResult'; value: boolean }
  | { type: 'toggleSidebar' }
  | { type: 'toggleAssistant' }
  | { type: 'settingsOpen'; value: boolean };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'initialized':
      return { ...state, settings: action.settings, appInfo: action.appInfo };
    case 'settings':
      return { ...state, settings: action.settings };
    case 'files':
      return { ...state, files: action.files };
    case 'document':
      return {
        ...state,
        document: action.document,
        content: action.document?.content ?? '',
        savedContent: action.document?.content ?? '',
        selection: { start: 0, end: 0 },
        saveStatus: action.document ? 'saved' : 'idle',
        error: null,
      };
    case 'content':
      return { ...state, content: action.content, saveStatus: 'dirty' };
    case 'selection':
      return { ...state, selection: { start: action.start, end: action.end } };
    case 'saveStatus':
      return { ...state, saveStatus: action.status };
    case 'saved':
      return {
        ...state,
        savedContent: action.content,
        document: state.document
          ? { ...state.document, modifiedAt: action.modifiedAt }
          : null,
        saveStatus: state.content === action.content ? 'saved' : 'dirty',
      };
    case 'error':
      return { ...state, error: action.message };
    case 'stage':
      return { ...state, stage: action.stage };
    case 'analysisStarted':
      return { ...state, requestId: action.requestId, error: null };
    case 'analysisFinished':
      return {
        ...state,
        requestId: null,
        result: action.result,
        usePreviousResult: false,
      };
    case 'analysisStopped':
      return { ...state, requestId: null };
    case 'instructions':
      return { ...state, instructions: action.value };
    case 'usePreviousResult':
      return { ...state, usePreviousResult: action.value };
    case 'toggleSidebar':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'toggleAssistant':
      return { ...state, assistantOpen: !state.assistantOpen };
    case 'settingsOpen':
      return { ...state, settingsOpen: action.value };
  }
}

const StateContext = createContext<AppState | null>(null);
const DispatchContext = createContext<Dispatch<AppAction> | null>(null);

export function AppStoreProvider({ children }: PropsWithChildren): React.JSX.Element {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export function useAppState(): AppState {
  const value = useContext(StateContext);
  if (!value) throw new Error('AppStoreProvider가 필요합니다.');
  return value;
}

export function useAppDispatch(): Dispatch<AppAction> {
  const value = useContext(DispatchContext);
  if (!value) throw new Error('AppStoreProvider가 필요합니다.');
  return value;
}
