import React from 'react';
import { useGetStartupConfig } from 'librechat-data-provider';
import { useLocalize } from '~/hooks';

export default function Footer() {
  const { data: config } = useGetStartupConfig();
  const localize = useLocalize();

  const egyptianFlagImage = (
    <img 
      src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Flag_of_Palestine_-_long_triangle.svg/120px-Flag_of_Palestine_-_long_triangle.svg.png" 
      alt="🇪🇬" 
      style={{ height: '1em', marginLeft: '0.5em', marginRight: '0.5em' }} 
    />
  );

  return (
    <div className="relative px-2 py-2 text-center text-xs text-gray-600 dark:text-gray-300 md:px-[60px]">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
              {'ChatGPT4MENA' || config?.appTitle} v25.1.24 
            </a>
            {'  -  '} {egyptianFlagImage} {localize('com_ui_new_footer')}
          </>
        )}
      </div>
    </div>
  );
}
