import type { AIStage, AssistantResult } from '../../../shared/contracts';

const STAGES: Array<{ id: AIStage; label: string; number: number }> = [
  { id: 'organize', label: '체계화', number: 1 },
  { id: 'structure', label: '구조화', number: 2 },
  { id: 'validate', label: '개념검증', number: 3 },
  { id: 'realize', label: '현실화', number: 4 },
];

const BADGE_LABELS = {
  'user-stated': '사용자 진술',
  'ai-organized': 'AI 정리',
  'ai-inferred': 'AI 추론',
  'needs-verification': '확인 필요',
} as const;

interface AssistantPanelProps {
  stage: AIStage;
  result: AssistantResult | null;
  loading: boolean;
  scopeLabel: string;
  instructions: string;
  usePreviousResult: boolean;
  onStage: (stage: AIStage) => void;
  onAnalyze: () => void;
  onCancel: () => void;
  onInstructions: (value: string) => void;
  onUsePreviousResult: (value: boolean) => void;
  onCopy: () => void;
  onAppend: () => void;
  onInsert: () => void;
  onSaveNew: () => void;
  onOpenAI: (key: 'chatgpt' | 'claude' | 'gemini' | 'grok') => void;
}

export function AssistantPanel({
  stage,
  result,
  loading,
  scopeLabel,
  instructions,
  usePreviousResult,
  onStage,
  onAnalyze,
  onCancel,
  onInstructions,
  onUsePreviousResult,
  onCopy,
  onAppend,
  onInsert,
  onSaveNew,
  onOpenAI,
}: AssistantPanelProps): React.JSX.Element {
  return (
    <aside className="assistant panel">
      <div className="assistant-heading">
        <div>
          <span className="eyebrow">THINKING ASSISTANT</span>
          <strong>사고 도우미</strong>
        </div>
        <span className="ai-indicator">AI</span>
      </div>
      <div className="stage-grid" aria-label="분석 단계">
        {STAGES.map((item) => (
          <button
            key={item.id}
            className={stage === item.id ? 'active' : ''}
            onClick={() => onStage(item.id)}
          >
            <span>{item.number}</span>
            {item.label}
          </button>
        ))}
      </div>
      <div className="analysis-scope">
        <span>분석 범위</span>
        <strong>{scopeLabel}</strong>
      </div>
      <button
        className="primary analyze-button"
        onClick={loading ? onCancel : onAnalyze}
        disabled={!scopeLabel}
      >
        {loading ? (
          <>
            <span className="spinner" /> 분석 취소
          </>
        ) : (
          `${STAGES.find((item) => item.id === stage)?.label ?? '최종 프롬프트'} 실행`
        )}
      </button>

      <div className="assistant-results">
        {!result && !loading && (
          <div className="assistant-empty">
            <span>✦</span>
            <strong>분석 결과가 여기에 표시됩니다</strong>
            <p>원문은 자동으로 변경되지 않습니다.</p>
          </div>
        )}
        {loading && (
          <div className="assistant-empty">
            <span className="large-spinner" />
            <strong>생각을 정리하고 있습니다</strong>
            <p>문서 내용은 AI 버튼을 누른 지금만 전송됩니다.</p>
          </div>
        )}
        {result && !loading && (
          <article className="result-stack">
            <section className="result-card accent">
              <span className="eyebrow">핵심 요약</span>
              <h2>{result.title}</h2>
              <p>{result.summary}</p>
            </section>
            {result.sections.map((section) => (
              <section className="result-card" key={section.id}>
                <h3>{section.title}</h3>
                <ul>
                  {section.items.map((item) => (
                    <li key={item.id}>
                      <span className={`evidence-badge ${item.evidenceStatus}`}>
                        {BADGE_LABELS[item.evidenceStatus]}
                      </span>
                      <span>{item.content}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            {result.questions.length > 0 && (
              <section className="result-card questions">
                <h3>확인 질문</h3>
                <ol>
                  {result.questions.map((item) => (
                    <li key={item.id}>{item.question}</li>
                  ))}
                </ol>
              </section>
            )}
            {result.nextActions.length > 0 && (
              <section className="result-card actions-card">
                <h3>다음 행동</h3>
                <ol>
                  {result.nextActions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </section>
            )}
            <div className="result-actions">
              <button onClick={onCopy}>결과 복사</button>
              <button onClick={onInsert}>선택 영역 아래 삽입</button>
              <button onClick={onAppend}>문서 끝에 추가</button>
              <button onClick={onSaveNew}>새 문서로 저장</button>
            </div>
            <label className="use-result">
              <input
                type="checkbox"
                checked={usePreviousResult}
                onChange={(event) => onUsePreviousResult(event.target.checked)}
              />
              이 결과를 다음 분석의 참고 내용으로 사용
            </label>
          </article>
        )}
      </div>
      <div className="assistant-footer">
        <label>
          <span>AI에게 추가 지시</span>
          <textarea
            rows={2}
            value={instructions}
            onChange={(event) => onInstructions(event.target.value)}
            placeholder="예: 비용 제약을 우선해서 검토해 줘"
          />
        </label>
        <button className="prompt-button" onClick={() => onStage('prompt')}>
          <span>✦</span> 최종 프롬프트 만들기
        </button>
        {result?.stage === 'prompt' && (
          <div className="external-buttons">
            <span>복사 후 웹 AI에서 열기</span>
            <div>
              <button onClick={() => onOpenAI('chatgpt')}>ChatGPT</button>
              <button onClick={() => onOpenAI('claude')}>Claude</button>
              <button onClick={() => onOpenAI('gemini')}>Gemini</button>
              <button onClick={() => onOpenAI('grok')}>Grok</button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
