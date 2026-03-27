import type { ComponentType, ReactElement, SVGProps } from 'react';
import React from 'react';

import AlignCenter from '@/shared/assets/icons/align-center.svg';
import AlignLeft from '@/shared/assets/icons/align-left.svg';
import AlignRight from '@/shared/assets/icons/align-right.svg';
import ArrowCurveLeftRightSvg from '@/shared/assets/icons/arrow-curve-left-right.svg';
import ArrowUpSvg from '@/shared/assets/icons/arrow-up.svg';
import CalendarSvg from '@/shared/assets/icons/calendar.svg';
import ChevronRight from '@/shared/assets/icons/chevron-right.svg';
import CodeBlockSvg from '@/shared/assets/icons/code.svg';
import ColorSvg from '@/shared/assets/icons/color.svg';
import DashSvg from '@/shared/assets/icons/dash.svg';
import EditSvg from '@/shared/assets/icons/edit.svg';
import EyeSvg from '@/shared/assets/icons/eye.svg';
import FileSvg from '@/shared/assets/icons/file.svg';
import FitSizeSvg from '@/shared/assets/icons/fit-size.svg';
import GithubSvg from '@/shared/assets/icons/github.svg';
import GlobeSvg from '@/shared/assets/icons/globe.svg';
import HamburgerSvg from '@/shared/assets/icons/hamburger.svg';
import ImageSvg from '@/shared/assets/icons/image.svg';
import ImageQuestionSvg from '@/shared/assets/icons/image-question.svg';
import KebabSvg from '@/shared/assets/icons/kebab.svg';
import LinkSvg from '@/shared/assets/icons/link.svg';
import LinkExternalSvg from '@/shared/assets/icons/link-external.svg';
import LinkedInSvg from '@/shared/assets/icons/linked-in.svg';
import LockSvg from '@/shared/assets/icons/lock.svg';
import LockOpenSvg from '@/shared/assets/icons/lock_open.svg';
import MailSolidSvg from '@/shared/assets/icons/mail-solid.svg';
import MarkDownBoldSvg from '@/shared/assets/icons/markdown-bold.svg';
import MarkDownItalicSvg from '@/shared/assets/icons/markdown-italic.svg';
import MarkDownStrikeSvg from '@/shared/assets/icons/markdown-strike.svg';
import MarkDownUnderLineSvg from '@/shared/assets/icons/markdown-underline.svg';
import MoonSvg from '@/shared/assets/icons/moon.svg';
import QuoteSvg from '@/shared/assets/icons/quote.svg';
import ReportSvg from '@/shared/assets/icons/report.svg';
import SearchSvg from '@/shared/assets/icons/search.svg';
import SendSvg from '@/shared/assets/icons/send.svg';
import ShareSvg from '@/shared/assets/icons/share.svg';
import SpoilerSvg from '@/shared/assets/icons/spoiler.svg';
import SubtextSvg from '@/shared/assets/icons/subtext.svg';
import SunSvg from '@/shared/assets/icons/sun.svg';
import SystemSvg from '@/shared/assets/icons/system.svg';
import TableSvg from '@/shared/assets/icons/table.svg';
import TextBgColorSvg from '@/shared/assets/icons/text-bg-color.svg';
import TrashSvg from '@/shared/assets/icons/trash.svg';
import YoutubeSvg from '@/shared/assets/icons/youtube.svg';
import ZoomInSvg from '@/shared/assets/icons/zoom-in.svg';
import ZoomOutSvg from '@/shared/assets/icons/zoom-out.svg';

type AppIconColor =
  | 'black'
  | 'current'
  | 'error'
  | 'muted'
  | 'primary'
  | 'surface'
  | 'text'
  | 'white';
type AppIconSize = 'lg' | 'md' | 'sm' | number;

const iconColorMap: Record<Exclude<AppIconColor, 'current'>, string> = {
  black: 'var(--colors-black)',
  error: 'var(--colors-error)',
  muted: 'var(--colors-muted)',
  primary: 'var(--colors-primary)',
  surface: 'var(--colors-surface)',
  text: 'var(--colors-text)',
  white: 'var(--colors-white)',
};

const iconSizeMap: Record<Exclude<AppIconSize, number>, number> = {
  lg: 20,
  md: 16,
  sm: 14,
};

export type AppIconProps = Omit<SVGProps<SVGSVGElement>, 'color' | 'height' | 'width'> & {
  color?: AppIconColor;
  customColor?: string;
  size?: AppIconSize;
};
export type AppIconComponent = (props: AppIconProps) => ReactElement;

const baseIconStyle: React.CSSProperties = {
  display: 'block',
  flex: '0 0 auto',
  verticalAlign: 'middle',
};

/**
 * 아이콘 사이즈 토큰(sm/md/lg) 또는 숫자 값을 실제 픽셀 크기로 변환합니다.
 */
const resolveIconSize = (size: AppIconSize): number =>
  typeof size === 'number' ? size : iconSizeMap[size];

/**
 * 아이콘 색상 토큰 또는 커스텀 색상 값을 CSS color 값으로 변환합니다.
 */
const resolveIconColor = ({
  color,
  customColor,
}: Pick<AppIconProps, 'color' | 'customColor'>): string => {
  if (customColor) return customColor;
  if (!color || color === 'current') return 'currentColor';

  return iconColorMap[color];
};

/**
 * SVGR 아이콘을 공통 props/스타일 규격으로 감싸서 앱 전역에서 재사용합니다.
 */
const createAppIcon = (
  Svg: ComponentType<SVGProps<SVGSVGElement>> | string,
  {
    defaultSize = 16,
  }: {
    defaultSize?: number;
  } = {},
) => {
  /**
   * 앱 공통 SVG 아이콘 컴포넌트입니다.
   * `size`로 아이콘 크기를 통제하고 색상은 `currentColor`를 따릅니다.
   */
  const AppIcon: AppIconComponent = ({
    color = 'current',
    customColor,
    size = defaultSize,
    style,
    ...props
  }: AppIconProps) => {
    const resolvedSize = resolveIconSize(size);
    const resolvedColor = resolveIconColor({ color, customColor });
    const iconStyle: React.CSSProperties = {
      ...baseIconStyle,
      color: resolvedColor,
      ...style,
    };

    if (typeof Svg === 'string') {
      const isDecorative = props['aria-hidden'] === true || props['aria-hidden'] === 'true';
      const { role, ...restProps } = props;

      return (
        <svg
          aria-hidden={isDecorative ? true : undefined}
          dangerouslySetInnerHTML={{ __html: Svg }}
          focusable="false"
          height={resolvedSize}
          role={isDecorative ? undefined : (role ?? 'img')}
          style={iconStyle}
          viewBox="0 0 24 24"
          width={resolvedSize}
          {...restProps}
        />
      );
    }

    return (
      <Svg
        focusable="false"
        height={resolvedSize}
        style={iconStyle}
        width={resolvedSize}
        {...props}
      />
    );
  };

  return AppIcon;
};

export const AlignCenterIcon = createAppIcon(AlignCenter);
export const AlignLeftIcon = createAppIcon(AlignLeft);
export const AlignRightIcon = createAppIcon(AlignRight);
export const ArrowCurveLeftRightIcon = createAppIcon(ArrowCurveLeftRightSvg);
export const ArrowUpIcon = createAppIcon(ArrowUpSvg);
export const CalendarIcon = createAppIcon(CalendarSvg);
export const ChevronRightIcon = createAppIcon(ChevronRight);
export const EditIcon = createAppIcon(EditSvg);
export const EyeIcon = createAppIcon(EyeSvg);
export const HamburgerIcon = createAppIcon(HamburgerSvg);
export const KebabIcon = createAppIcon(KebabSvg);
export const FitSizeIcon = createAppIcon(FitSizeSvg);
export const GithubIcon = createAppIcon(GithubSvg);
export const GlobeIcon = createAppIcon(GlobeSvg);
export const LinkExternalIcon = createAppIcon(LinkExternalSvg);
export const LinkedInIcon = createAppIcon(LinkedInSvg);
export const LinkIcon = createAppIcon(LinkSvg);
export const LockIcon = createAppIcon(LockSvg);
export const LockOpenIcon = createAppIcon(LockOpenSvg);
export const MailSolidIcon = createAppIcon(MailSolidSvg);
export const MoonIcon = createAppIcon(MoonSvg);
export const ImageQuestionIcon = createAppIcon(ImageQuestionSvg);
export const ReportIcon = createAppIcon(ReportSvg);
export const SearchIcon = createAppIcon(SearchSvg);
export const SendIcon = createAppIcon(SendSvg);
export const ShareIcon = createAppIcon(ShareSvg);
export const SunIcon = createAppIcon(SunSvg);
export const SystemIcon = createAppIcon(SystemSvg);
export const TrashIcon = createAppIcon(TrashSvg);
export const FileIcon = createAppIcon(FileSvg);
export const MarkDownBoldIcon = createAppIcon(MarkDownBoldSvg);
export const MarkDownItalicIcon = createAppIcon(MarkDownItalicSvg);
export const MarkDownStrikeIcon = createAppIcon(MarkDownStrikeSvg);
export const MarkDownUnderlineIcon = createAppIcon(MarkDownUnderLineSvg);
export const QuoteIcon = createAppIcon(QuoteSvg);
export const CodeBlockIcon = createAppIcon(CodeBlockSvg);
export const ImageIcon = createAppIcon(ImageSvg);
export const TableIcon = createAppIcon(TableSvg);
export const DashIcon = createAppIcon(DashSvg);
export const SpoilerIcon = createAppIcon(SpoilerSvg);
export const ColorIcon = createAppIcon(ColorSvg);
export const TextBgColorIcon = createAppIcon(TextBgColorSvg);
export const YoutubeIcon = createAppIcon(YoutubeSvg);
export const SubtextIcon = createAppIcon(SubtextSvg);
export const ZoomInIcon = createAppIcon(ZoomInSvg);
export const ZoomOutIcon = createAppIcon(ZoomOutSvg);
