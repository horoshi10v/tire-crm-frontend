import type { LotPublicResponse } from '../types/lot';

const fallbackCopyText = (value: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
};

export const getLotShareLink = (lotId: string) => {
    const url = new URL(window.location.pathname, window.location.origin);
    url.searchParams.set('lot', lotId);
    return url.toString();
};

export const shareLotLink = async (lot: Pick<LotPublicResponse, 'id' | 'brand' | 'model'>) => {
    const shareLink = getLotShareLink(lot.id);
    const shareData = {
        title: `${lot.brand} ${lot.model}`.trim(),
        text: `Перегляньте товар ${`${lot.brand} ${lot.model}`.trim()}`,
        url: shareLink,
    };

    if (navigator.share && (!navigator.canShare || navigator.canShare({ url: shareLink }))) {
        await navigator.share(shareData);
        return { method: 'share' as const, url: shareLink };
    }

    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareLink);
        return { method: 'copy' as const, url: shareLink };
    }

    fallbackCopyText(shareLink);
    return { method: 'copy' as const, url: shareLink };
};

export const copyLotShareLink = async (lot: Pick<LotPublicResponse, 'id'>) => {
    const shareLink = getLotShareLink(lot.id);

    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareLink);
        return shareLink;
    }

    fallbackCopyText(shareLink);
    return shareLink;
};
