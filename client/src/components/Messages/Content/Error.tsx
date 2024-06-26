import React from 'react';
import type { TOpenAIMessage } from 'librechat-data-provider';
import { formatJSON, extractJson } from '~/utils/json';
import CodeBlock from './CodeBlock';

const isJson = (str: string) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

type TConcurrent = {
  limit: number;
};

type TMessageLimit = {
  max: number;
  windowInMinutes: number;
};

type TTokenBalance = {
  type: 'token_balance';
  balance: number;
  tokenCost: number;
  promptTokens: number;
  prev_count: number;
  violation_count: number;
  date: Date;
  generations?: TOpenAIMessage[];
};

const errorMessages = {
  ban: 'Your account has been temporarily banned due to violations of our service.',
  invalid_api_key:
    'Invalid API key. Please check your API key and try again. You can do this by clicking on the model logo in the left corner of the textbox and selecting "Set Token" for the current selected endpoint. Thank you for your understanding.',
  insufficient_quota:
    'We apologize for any inconvenience caused. The default API key has reached its limit. To continue using this service, please set up your own API key. You can do this by clicking on the model logo in the left corner of the textbox and selecting "Set Token" for the current selected endpoint. Thank you for your understanding.',
  concurrent: (json: TConcurrent) => {
    const { limit } = json;
    const plural = limit > 1 ? 's' : '';
    return `Only ${limit} message${plural} at a time. Please allow any other responses to complete before sending another message, or wait one minute.`;
  },
  message_limit: (json: TMessageLimit) => {
    const { max, windowInMinutes } = json;
    const plural = max > 1 ? 's' : '';
    return `You hit the message limit. You have a cap of ${max} message${plural} per ${
      windowInMinutes > 1 ? `${windowInMinutes} minutes` : 'minute'
    }.`;
  },
  token_balance: (json: TTokenBalance) => {
    const { balance } = json;
    const message = ` انت غير مشترك. رصيدك الحالي (${balance}) .  لطلب تجربة مجانية او الاستفسار او للاشتراك  `;
    
    return (
      <>
        {message} 
        <a
          href="https://www.facebook.com/profile.php?id=61552521565850&mibextid=LQQJ4d/"
          target="_blank"
          rel="noreferrer noopener" // It's better to include 'noopener' for security reasons.
          className="underline"
        >
          اضغط هنا
        </a>
        {json.generations && (
          <>
            <br />
            <br />
          </>
        )}
      </>
    );
  },
};

const Error = ({ text }: { text: string }) => {
  const jsonString = extractJson(text);
  const errorMessage = text.length > 512 && !jsonString ? text.slice(0, 512) + '...' : text;
  const defaultResponse = `Something went wrong. Here's the specific error message we encountered: ${errorMessage}`;

  if (!isJson(jsonString)) {
    return defaultResponse;
  }

  const json = JSON.parse(jsonString);
  const errorKey = json.code || json.type;
  const keyExists = errorKey && errorMessages[errorKey];

  if (keyExists && typeof errorMessages[errorKey] === 'function') {
    return errorMessages[errorKey](json);
  } else if (keyExists) {
    return errorMessages[errorKey];
  } else {
    return defaultResponse;
  }
};

export default Error;