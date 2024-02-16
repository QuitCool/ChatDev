import { useRecoilState } from 'recoil';
import { useState, useEffect } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { useAvailablePluginsQuery, TPlugin } from 'librechat-data-provider';
import type { TModelSelectProps } from '~/common';
import {
  SelectDropDown,
  SelectDropDownPop,
  MultiSelectDropDown,
  MultiSelectPop,
  Button,
} from '~/components/ui';
import { useSetIndexOptions, useAuthContext, useMediaQuery } from '~/hooks';
import { cn, cardStyle } from '~/utils/';
import store from '~/store';

const pluginStore: TPlugin = {
  name: 'Plugin store',
  pluginKey: 'pluginStore',
  isButton: true,
  description: '',
  icon: '',
  authConfig: [],
  authenticated: false,
};

export default function PluginsByIndex({
  conversation,
  setOption,
  models,
  showAbove,
  popover = true,
}: TModelSelectProps) {
  const { data: allPlugins } = useAvailablePluginsQuery();
  const [visible, setVisibility] = useState<boolean>(true);
  const [availableTools, setAvailableTools] = useRecoilState(store.availableTools);
  const { checkPluginSelection, setTools } = useSetIndexOptions();
  const { user } = useAuthContext();
  const isSmallScreen = useMediaQuery('(max-width: 640px)');

  useEffect(() => {
    if (isSmallScreen) {
      setVisibility(true);
    }
  }, [isSmallScreen]);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (!allPlugins) {
      return;
    }

    if (!user.plugins || user.plugins.length === 0) {
      setAvailableTools([pluginStore]);
      return;
    }

    const tools = [...user.plugins]
      .map((el) => allPlugins.find((plugin: TPlugin) => plugin.pluginKey === el))
      .filter((el): el is TPlugin => el !== undefined);

    /* Filter Last Selected Tools */
    const localStorageItem = localStorage.getItem('lastSelectedTools');
    if (!localStorageItem) {
      return setAvailableTools([...tools, pluginStore]);
    }
    const lastSelectedTools = JSON.parse(localStorageItem);
    const filteredTools = lastSelectedTools.filter((tool: TPlugin) =>
      tools.some((existingTool) => existingTool.pluginKey === tool.pluginKey),
    );
    localStorage.setItem('lastSelectedTools', JSON.stringify(filteredTools));

    setAvailableTools([...tools, pluginStore]);
    // setAvailableTools is a recoil state setter, so it's safe to use it in useEffect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPlugins, user]);

  if (!conversation) {
    return null;
  }

  const modelDisplayNames = {
    'gpt-4-turbo-preview': 'GPT 4 Turbo',
    'gpt-4-1106-preview': 'GPT 4',
    'gpt-4-0613': 'GPT 4 (06/13)',
    'gpt-4-vision-preview': 'GPT 4 (Vision)',
    'gpt-3.5-turbo-1106': 'GPT 3.5 (11/06)',
    'claude-2': 'Claude 2 (PRO)',
    'claude-instant': 'Claude 1 (FREE)',
    'gemini-pro': 'Gemini (PRO)',
    'gemini-pro-vision' :'Gemini (Vision)',
    'llama-2-70b-chat': 'LLaMA 2 (70 Billion)',
    'llama-2-13b-chat': 'LLaMA 2 (13 Billion)',
    'llama-2-7b-chat': 'LLaMA 2 (7 Billion)',
    'mixtral-8x7b': 'Mistral (8x7 Billion)',
  };

  const getModelDisplayName = (modelValue) => modelDisplayNames[modelValue] || modelValue;
  const Menu = popover ? SelectDropDownPop : SelectDropDown;
  const PluginsMenu = popover ? MultiSelectPop : MultiSelectDropDown;
  const handleModelChange = (selectedDisplayName) => {
    const selectedValue = Object.keys(modelDisplayNames).find(key => modelDisplayNames[key] === selectedDisplayName) || selectedDisplayName;
    setOption('model')(selectedValue);
  };

  return (
    <>
      <Button
        type="button"
        className={cn(
          cardStyle,
          'min-w-4 z-40 flex h-[40px] flex-none items-center justify-center px-3 hover:bg-white focus:ring-0 focus:ring-offset-0 dark:hover:bg-gray-700',
        )}
        onClick={() => setVisibility((prev) => !prev)}
      >
        <ChevronDownIcon
          className={cn(
            !visible ? '' : 'rotate-180 transform',
            'w-4 text-gray-600 dark:text-white',
          )}
        />
      </Button>
      {visible && (
        <>
          <Menu
            value={getModelDisplayName(conversation?.model ?? '')}
            setValue={handleModelChange}
            availableValues={models.map(getModelDisplayName)}
            showAbove={showAbove}
            showLabel={false}
          />
          <PluginsMenu
            value={conversation.tools || []}
            isSelected={checkPluginSelection}
            setSelected={setTools}
            availableValues={availableTools}
            optionValueKey="pluginKey"
            showAbove={false}
            showLabel={false}
          />
        </>
      )}
    </>
  );
}
