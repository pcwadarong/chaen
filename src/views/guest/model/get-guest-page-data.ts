import { getGuestbookThreads } from '@/entities/guestbook';
import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';
import type { GuestPageProps } from '@/views/guest/ui/guest-page';

type GetGuestPageDataInput = {
  locale: string;
};

/**
 * 방명록 페이지 첫 진입에 필요한 서버 데이터를 조합합니다.
 * 첫 페이지 스레드를 서버에서 미리 내려 클라이언트 초기 로딩을 줄입니다.
 */
export const getGuestPageData = async ({
  locale: _locale,
}: GetGuestPageDataInput): Promise<GuestPageProps> => {
  let includeSecret = false;

  try {
    const authState = await getServerAuthState();
    includeSecret = Boolean(authState.isAdmin);
  } catch {
    includeSecret = false;
  }

  try {
    const guestbookPage = await getGuestbookThreads({ includeSecret });
    return {
      initialCursor: guestbookPage.nextCursor,
      initialItems: guestbookPage.items,
    };
  } catch {
    return {
      initialCursor: null,
      initialItems: [],
    };
  }
};
