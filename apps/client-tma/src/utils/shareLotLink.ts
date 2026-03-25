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

export const copyLotShareLink = async (lot: Pick<LotPublicResponse, 'id'>) => {
    const shareLink = getLotShareLink(lot.id);

    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareLink);
        return shareLink;
    }

    fallbackCopyText(shareLink);
    return shareLink;
};
