import { describe, expect, it } from 'vitest';
import { appReducer, initialState } from '../src/renderer/state/appStore';

describe('appReducer 저장 상태', () => {
  it('저장 중 입력이 더 생기면 먼저 끝난 저장을 완료로 잘못 표시하지 않는다', () => {
    const editing = {
      ...initialState,
      document: {
        relativePath: 'note.md',
        name: 'note.md',
        extension: '.md' as const,
        modifiedAt: 1,
        size: 3,
        content: 'old',
      },
      content: 'newer text',
      savedContent: 'old',
      saveStatus: 'saving' as const,
    };

    const next = appReducer(editing, {
      type: 'saved',
      content: 'new',
      modifiedAt: 2,
    });

    expect(next.savedContent).toBe('new');
    expect(next.content).toBe('newer text');
    expect(next.saveStatus).toBe('dirty');
    expect(next.document?.modifiedAt).toBe(2);
  });
});
