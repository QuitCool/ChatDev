import { useGetStartupConfig } from 'librechat-data-provider';
import { useLocalize } from '~/hooks';

export default function Footer() {
  const { data: config } = useGetStartupConfig();
  const localize = useLocalize();
  return (
    <div className="relative px-2 py-2 text-center text-xs text-gray-600 dark:text-gray-300 md:px-[60px]">
      <span>
        {typeof config?.customFooter === 'string' ? (
          config.customFooter
        ) : (
          <>
            <a
              href="https://www.facebook.com/profile.php?id=61552521565850&mibextid=LQQJ4d/"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {config?.appTitle || 'ChatGPT'} v1.12.2023 <img src="URL_TO_EGYPTIAN_FLAG_IMAGE" alt="Egyptian Flag" style={{ height: '1em' }} />
            </a>
            {' - '} {localize('com_ui_new_footer')}
          </>
        )}
      </span>
    </div>
  );
}
