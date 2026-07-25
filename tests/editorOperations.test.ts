import { describe, expect, it } from 'vitest';
import {
  findLiteralMatch,
  replaceAllLiteral,
  replaceLiteralSelection,
} from '../src/renderer/utils/editorOperations';

describe('editorOperations', () => {
  it('찾기 문자열의 정규식 문자를 일반 문자로 취급하고 끝에서 처음으로 순환한다', () => {
    expect(findLiteralMatch('a+b / A+B', 'a+b', 3, 'next')).toEqual({
      start: 6,
      end: 9,
    });
    expect(findLiteralMatch('a+b / A+B', 'a+b', 9, 'next')).toEqual({
      start: 0,
      end: 3,
    });
  });

  it('이전 찾기도 문서 처음에서 마지막 일치 항목으로 순환한다', () => {
    expect(findLiteralMatch('one two one', 'one', 0, 'previous')).toEqual({
      start: 8,
      end: 11,
    });
  });

  it('달러 기호를 포함한 바꿀 내용을 치환 패턴이 아닌 원문 그대로 넣는다', () => {
    expect(replaceAllLiteral('alpha ALPHA', 'alpha', "$&-$`-$'")).toEqual({
      content: "$&-$`-$' $&-$`-$'",
      count: 2,
    });
  });

  it('선택 영역 하나를 바꾸고 새 선택 위치를 반환한다', () => {
    expect(
      replaceLiteralSelection('첫째 둘째 셋째', '둘째', '두 번째', {
        start: 3,
        end: 5,
      }),
    ).toEqual({
      content: '첫째 두 번째 셋째',
      selection: { start: 3, end: 7 },
    });
  });
});
