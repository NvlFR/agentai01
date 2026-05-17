import { Bot } from 'grammy';
import { chunkText } from '../../plugin-sdk/reply-chunking.js';
import { TELEGRAM_TEXT_CHUNK_LIMIT } from './constants.js';
import { buildTelegramThreadParams, type TelegramThreadSpec } from './bot-helpers.js';
import { resolveTelegramToken } from './token.js';

export type TelegramSendOptions = {
  cfg: unknown;
  token?: string;
  accountId?: string;
  thread?: TelegramThreadSpec | null;
  replyToMessageId?: number;
  silent?: boolean;
  parseMode?: 'HTML' | 'MarkdownV2';
};

export type TelegramSendResult = {
  messageId: string;
  chatId: string;
};

export async function sendTelegramText(
  chatId: string | number,
  text: string,
  opts: TelegramSendOptions,
): Promise<TelegramSendResult> {
  const token = opts.token ?? resolveTelegramToken(opts.cfg, opts.accountId);
  const bot = new Bot(token);
  
  const chunks = chunkText(text, TELEGRAM_TEXT_CHUNK_LIMIT);
  let lastMessageId = '';
  
  const threadParams = buildTelegramThreadParams(opts.thread);
  const baseParams: any = {
    ...threadParams,
    disable_notification: opts.silent,
    parse_mode: opts.parseMode,
  };

  if (opts.replyToMessageId) {
    baseParams.reply_to_message_id = opts.replyToMessageId;
  }

  for (const chunk of chunks) {
    const res = await bot.api.sendMessage(chatId, chunk, baseParams);
    lastMessageId = String(res.message_id);
  }

  return {
    messageId: lastMessageId,
    chatId: String(chatId),
  };
}

export async function sendTelegramMedia(
  chatId: string | number,
  media: { url: string; caption?: string; type: 'photo' | 'video' | 'document' },
  opts: TelegramSendOptions,
): Promise<TelegramSendResult> {
  const token = opts.token ?? resolveTelegramToken(opts.cfg, opts.accountId);
  const bot = new Bot(token);
  
  const threadParams = buildTelegramThreadParams(opts.thread);
  const baseParams: any = {
    ...threadParams,
    caption: media.caption,
    disable_notification: opts.silent,
    parse_mode: opts.parseMode,
  };

  let res: any;
  if (media.type === 'photo') {
    res = await bot.api.sendPhoto(chatId, media.url, baseParams);
  } else if (media.type === 'video') {
    res = await bot.api.sendVideo(chatId, media.url, baseParams);
  } else {
    res = await bot.api.sendDocument(chatId, media.url, baseParams);
  }

  return {
    messageId: String(res.message_id),
    chatId: String(chatId),
  };
}

export async function sendTelegramPoll(
  chatId: string | number,
  poll: { question: string; options: string[]; is_anonymous?: boolean },
  opts: TelegramSendOptions,
): Promise<TelegramSendResult> {
  const token = opts.token ?? resolveTelegramToken(opts.cfg, opts.accountId);
  const bot = new Bot(token);
  
  const threadParams = buildTelegramThreadParams(opts.thread);
  const res = await bot.api.sendPoll(chatId, poll.question, poll.options, {
    ...threadParams,
    is_anonymous: poll.is_anonymous,
    disable_notification: opts.silent,
  });

  return {
    messageId: String(res.message_id),
    chatId: String(chatId),
  };
}
