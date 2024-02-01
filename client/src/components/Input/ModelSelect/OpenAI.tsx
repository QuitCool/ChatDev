import { SelectDropDown, SelectDropDownPop } from '~/components/ui';
import { cn, cardStyle } from '~/utils/';
import type { TModelSelectProps } from '~/common';

export default function OpenAI({ conversation, setOption, models, showAbove = true, popover = true }: TModelSelectProps) {
  const modelDisplayNames = {
    'gpt-4-turbo-preview': 'GPT 4 (Turbo)',
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
  const handleModelChange = (selectedDisplayName) => {
    const selectedValue = Object.keys(modelDisplayNames).find(key => modelDisplayNames[key] === selectedDisplayName) || selectedDisplayName;
    setOption('model')(selectedValue);
  };

  return (
    <Menu
      value={getModelDisplayName(conversation?.model ?? '')}
      setValue={handleModelChange}
      availableValues={models.map(getModelDisplayName)}
      showAbove={showAbove}
      showLabel={false}
      className={cn(
        cardStyle,
        'min-w-48 z-50 flex h-[40px] w-48 flex-none items-center justify-center px-4 hover:cursor-pointer',
      )}
    />
  );
}