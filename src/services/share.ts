/**
 * Universal Share Helper
 * Supports Web Share API (native mobile/desktop share sheet with WhatsApp, Telegram, etc.)
 * Fallback to direct WhatsApp Web / WhatsApp Mobile URL and Clipboard
 */

export interface ShareOptions {
  title: string;
  text: string;
  url?: string;
}

export const shareToWhatsApp = (text: string) => {
  const encoded = encodeURIComponent(text);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
};

export const shareGeneral = async (options: ShareOptions): Promise<'shared' | 'copied' | 'whatsapp'> => {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: options.url || window.location.href,
      });
      return 'shared';
    } catch (err: unknown) {
      // User cancelled or share failed, fallback
      if ((err as Error)?.name === 'AbortError') {
        return 'shared';
      }
    }
  }

  // Fallback to clipboard
  try {
    const fullText = options.url ? `${options.text}\n${options.url}` : options.text;
    await navigator.clipboard.writeText(fullText);
    return 'copied';
  } catch {
    shareToWhatsApp(options.text);
    return 'whatsapp';
  }
};
