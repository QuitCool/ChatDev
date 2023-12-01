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
              {config?.appTitle || 'ChatGPT'} v1.12.2023
            </a>
            {' - '} {localize('com_ui_new_footer')}
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Flag_of_Egypt.svg/800px-Flag_of_Egypt.svg.png" alt="Egyptian Flag" style={{ height: '1em', marginLeft: '0.5em' }} />
          </>
        )}
      </span>
    </div>
  );
}
