import { createActionFailure, createActionSuccess } from './action-result';

describe('action-result', () => {
  it('성공 결과를 공통 계약 형태로 생성한다', () => {
    expect(createActionSuccess({ id: 'entry-1' })).toEqual({
      data: { id: 'entry-1' },
      errorMessage: null,
      ok: true,
    });
  });

  it('실패 결과를 공통 계약 형태로 생성한다', () => {
    expect(createActionFailure('invalid input')).toEqual({
      data: null,
      errorMessage: 'invalid input',
      ok: false,
    });
  });
});
