import en from "../messages/en.json";
import ja from "../messages/ja.json";

const messagesByLocale = { en, ja };

// Configure next-intl for Storybook
const nextIntl = {
  defaultLocale: "ja",
  messagesByLocale,
  onError: (error) => console.error(error),
  getMessageFallback: ({ namespace, key }) => `${namespace}.${key}`,
};

export default nextIntl;
