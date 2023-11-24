import { SelectDropDown } from '~/components/ui';
import { cn, cardStyle } from '~/utils/';
import type { TModelSelectProps } from '~/common';

export default function OpenAI({ conversation, setOption, models }: TModelSelectProps) {
  const modelDisplayNames = {
    'gpt-4-1106-preview': 'GPT 4 Turbo',
    'gpt-4-0613': 'GPT 4',
    'gpt-3.5-turbo-1106': 'GPT 3.5 Turbo',
    // Add other model mappings here if necessary
  };

  const getModelDisplayName = (modelValue) => modelDisplayNames[modelValue] || modelValue;

  const handleModelChange = (selectedDisplayName) => {
    const selectedValue = Object.keys(modelDisplayNames).find(key => modelDisplayNames[key] === selectedDisplayName) || selectedDisplayName;
    setOption('model')(selectedValue);
  };

  return (
    <SelectDropDown
      value={getModelDisplayName(conversation?.model ?? '')}
      setValue={handleModelChange}
      availableValues={models.map(getModelDisplayName)}
      showAbove={true}
      showLabel={false}
      className={cn(
        cardStyle,
        'min-w-48 z-50 flex h-[40px] w-48 flex-none items-center justify-center px-4 hover:cursor-pointer',
      )}
    />
  );
}