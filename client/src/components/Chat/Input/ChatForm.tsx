import React, { useRef } from 'react';
import { useRecoilState } from 'recoil';
import { useChatContext } from '~/Providers';
import AttachFile from './Files/AttachFile';
import StopButton from './StopButton';
import SendButton from './SendButton';
import Images from './Files/Images';
import Textarea from './Textarea';
import store from '~/store';

export default function ChatForm({ index = 0 }) {
  const [text, setText] = useRecoilState(store.textByIndex(index));
  const textAreaRef = useRef(null);
  const {
    ask,
    files,
    setFiles,
    conversation,
    isSubmitting,
    handleStopGenerating,
    filesLoading,
    setFilesLoading,
    showStopButton,
    setShowStopButton,
  } = useChatContext();

  const handleFocus = () => {
    setTimeout(() => {
      // Scroll into view logic
      if (textAreaRef.current) {
        textAreaRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }, 300);
  };

  const submitMessage = () => {
    ask({ text });
    setText('');
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submitMessage();
      }}
      className="stretch mx-2 flex flex-row gap-3 last:mb-2 md:mx-4 md:last:mb-6 lg:mx-auto lg:max-w-2xl xl:max-w-3xl"
    >
      <div className="relative flex h-full flex-1 items-stretch md:flex-col">
        <div className="flex w-full items-center">
          <div className="[&:has(textarea:focus)]:border-token-border-xheavy border-token-border-heavy shadow-xs dark:shadow-xs relative flex w-full flex-grow flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_0_0_2px_rgba(255,255,255,0.95)] dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:shadow-[0_0_0_2px_rgba(52,53,65,0.95)] [&:has(textarea:focus)]:shadow-[0_2px_6px_rgba(0,0,0,.05)]">
            <Images files={files} setFiles={setFiles} setFilesLoading={setFilesLoading} />
            <Textarea
              ref={textAreaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              setText={setText}
              submitMessage={submitMessage}
              endpoint={conversation?.endpoint}
              onFocus={handleFocus}
            />
            <AttachFile endpoint={conversation?.endpoint ?? ''} />
            {isSubmitting && showStopButton ? (
              <StopButton stop={handleStopGenerating} setShowStopButton={setShowStopButton} />
            ) : (
              <SendButton text={text} disabled={filesLoading || isSubmitting} />
            )}
          </div>
        </div>
      </div>
    </form>
  );
}