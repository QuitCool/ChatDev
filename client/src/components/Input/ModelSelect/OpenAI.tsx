import { SelectDropDown, SelectDropDownPop } from '~/components/ui';
import type { TModelSelectProps } from '~/common';
import { cn, cardStyle } from '~/utils/';

export default function OpenAI({
  conversation,
  setOption,
  models,
  showAbove = true,
  popover = true,
}: TModelSelectProps) {
  const Menu = popover ? SelectDropDownPop : SelectDropDown;

  // Mapping of model internal names to display names
  const modelNameMappings = {
    'gpt-4-1106-preview': 'GPT 4 Turbo',
    'gpt-4-vision-preview': 'GPT 4 Vision',
    'gpt-4-0613': 'GPT 4',
    'gpt-3.5-turbo-1106': 'GPT 3.5 Turbo',
  };

  // Function to alias model names
  const aliasModelName = (modelName) => {
    return modelNameMappings[modelName] || modelName;
  };

  return (
    <Menu
      value={aliasModelName(conversation?.model ?? '')}
      setValue={setOption('model')}
      availableValues={models.map(model => aliasModelName(model))}
      showAbove={showAbove}
      showLabel={false}
      className={cn(
        cardStyle,
        'min-w-48 z-50 flex h-[40px] w-48 flex-none items-center justify-center px-4 hover:cursor-pointer',
      )}
    />
  );
}
