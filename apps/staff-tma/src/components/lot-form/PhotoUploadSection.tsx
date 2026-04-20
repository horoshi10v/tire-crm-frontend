import { useLayoutEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import type { PendingPhotoUpload } from './types';

type Props = {
  isDragOver: boolean;
  isUploadingPhotos: boolean;
  uploadingPhotosCount: number;
  isSubmitting: boolean;
  uploadProgress: { completed: number; total: number };
  hasActiveUploadProgress: boolean;
  pendingPhotoUploads: PendingPhotoUpload[];
  photos: string[];
  onDragOver: (event: DragEvent<HTMLLabelElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent<HTMLLabelElement>) => void;
  onFileInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: (photoUrl: string) => void;
  onReorderPhoto: (fromPhotoUrl: string, toPhotoUrl: string) => void;
  onReorderPendingPhoto: (fromPendingId: string, toPendingId: string) => void;
};

function useFlipListAnimation(itemKeys: string[]) {
  const elementMapRef = useRef(new Map<string, HTMLDivElement>());
  const previousRectsRef = useRef(new Map<string, DOMRect>());

  useLayoutEffect(() => {
    const nextRects = new Map<string, DOMRect>();

    itemKeys.forEach((itemKey) => {
      const element = elementMapRef.current.get(itemKey);
      if (!element) {
        return;
      }

      const nextRect = element.getBoundingClientRect();
      nextRects.set(itemKey, nextRect);

      const previousRect = previousRectsRef.current.get(itemKey);
      if (!previousRect) {
        return;
      }

      const deltaX = previousRect.left - nextRect.left;
      const deltaY = previousRect.top - nextRect.top;

      if (deltaX === 0 && deltaY === 0) {
        return;
      }

      element.animate(
        [
          {
            transform: `translate(${deltaX}px, ${deltaY}px) scale(0.98)`,
          },
          {
            transform: 'translate(0, 0) scale(1)',
          },
        ],
        {
          duration: 220,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        },
      );
    });

    previousRectsRef.current = nextRects;
  }, [itemKeys]);

  const bindAnimatedRef = (itemKey: string) => (element: HTMLDivElement | null) => {
    if (element) {
      elementMapRef.current.set(itemKey, element);
      return;
    }

    elementMapRef.current.delete(itemKey);
    previousRectsRef.current.delete(itemKey);
  };

  return bindAnimatedRef;
}

export default function PhotoUploadSection({
  isDragOver,
  isUploadingPhotos,
  uploadingPhotosCount,
  isSubmitting,
  uploadProgress,
  hasActiveUploadProgress,
  pendingPhotoUploads,
  photos,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileInputChange,
  onRemovePhoto,
  onReorderPhoto,
  onReorderPendingPhoto,
}: Props) {
  const [draggedPendingId, setDraggedPendingId] = useState<string | null>(null);
  const [draggedPhotoUrl, setDraggedPhotoUrl] = useState<string | null>(null);
  const [selectedPendingId, setSelectedPendingId] = useState<string | null>(null);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const bindPendingPhotoRef = useFlipListAnimation(pendingPhotoUploads.map((upload) => upload.id));
  const bindPhotoRef = useFlipListAnimation(photos);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Фото</h3>
        <label
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`inline-flex cursor-pointer items-center rounded-lg border px-3 py-2 text-xs font-semibold transition ${
            isDragOver
              ? 'border-emerald-600/70 bg-emerald-900/25 text-emerald-200'
              : 'border-blue-700/60 bg-blue-900/25 text-blue-200 hover:bg-blue-900/40'
          }`}
        >
          {isUploadingPhotos ? `Завантаження ${uploadingPhotosCount} фото...` : 'Завантажити фото'}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onFileInputChange}
            disabled={isUploadingPhotos || isSubmitting}
            className="hidden"
          />
        </label>
      </div>

      <label
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-5 text-center transition ${
          isDragOver
            ? 'border-emerald-500/60 bg-emerald-900/15'
            : 'border-gray-700 bg-gray-950/70 hover:border-blue-600/50 hover:bg-gray-950'
        } ${isSubmitting || isUploadingPhotos ? 'cursor-not-allowed opacity-70' : ''}`}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={onFileInputChange}
          disabled={isUploadingPhotos || isSubmitting}
          className="hidden"
        />
        <p className="text-sm font-semibold text-white">Перетягніть сюди фото або натисніть, щоб вибрати одразу кілька</p>
        <p className="mt-1 text-xs text-gray-500">Підтримується мультивибір з галереї та drag-and-drop пачкою.</p>
      </label>

      {uploadProgress.total > 0 ? (
        <div className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2">
          <div className="flex items-center justify-between gap-3 text-xs text-gray-300">
            <span>Прогрес завантаження</span>
            <span className="font-semibold text-white">
              {Math.min(uploadProgress.completed, uploadProgress.total)} з {uploadProgress.total}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{
                width: `${uploadProgress.total > 0 ? (Math.min(uploadProgress.completed, uploadProgress.total) / uploadProgress.total) * 100 : 0}%`,
              }}
            />
          </div>
          {hasActiveUploadProgress ? <p className="mt-2 text-[11px] text-gray-500">Фото завантажуються паралельно.</p> : null}
        </div>
      ) : null}

      {pendingPhotoUploads.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {pendingPhotoUploads.map((upload, index) => (
            <div
              key={upload.id}
              ref={bindPendingPhotoRef(upload.id)}
              draggable
              onDragStart={() => setDraggedPendingId(upload.id)}
              onDragEnd={() => setDraggedPendingId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (draggedPendingId && draggedPendingId !== upload.id) {
                  onReorderPendingPhoto(draggedPendingId, upload.id);
                }
                setDraggedPendingId(null);
              }}
              onClick={() => {
                if (selectedPendingId && selectedPendingId !== upload.id) {
                  onReorderPendingPhoto(selectedPendingId, upload.id);
                  setSelectedPendingId(null);
                  return;
                }

                setSelectedPendingId((prev) => (prev === upload.id ? null : upload.id));
              }}
              className={`overflow-hidden rounded-xl border bg-gray-950 transition ${
                draggedPendingId === upload.id
                  ? 'scale-[0.98] border-emerald-500/60 opacity-70'
                  : selectedPendingId === upload.id
                    ? 'border-emerald-400/70 ring-2 ring-emerald-500/20'
                    : 'border-gray-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-gray-800 px-2 py-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-gray-700 bg-gray-900 px-1 text-[10px] font-semibold text-gray-200">
                    {index + 1}
                  </span>
                  <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-wide ${
                    pendingPhotoUploads[0]?.id === upload.id
                      ? 'bg-emerald-500/15 text-emerald-200'
                      : 'bg-gray-800 text-gray-400'
                  }`}>
                    {pendingPhotoUploads[0]?.id === upload.id ? 'Головне фото' : 'Чернетка'}
                  </span>
                </div>
                {selectedPendingId === upload.id ? (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300">Обрано</span>
                ) : null}
              </div>
              <div
                draggable={false}
              >
                <div className="aspect-square bg-gray-900">
                  <img src={upload.previewUrl} alt={upload.fileName} className="h-full w-full object-cover" />
                </div>
                <div className="space-y-1 px-2 py-2">
                  <p className="truncate text-[11px] text-gray-400">{upload.fileName}</p>
                  <p className={`text-[11px] font-semibold ${upload.status === 'error' ? 'text-red-300' : 'text-amber-300'}`}>
                    {upload.status === 'error' ? 'Помилка завантаження' : 'Завантажується...'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {photos.length === 0 && pendingPhotoUploads.length === 0 ? (
        <p className="text-sm text-gray-500">Фото не додані.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photoUrl, index) => (
            <div
              key={photoUrl}
              ref={bindPhotoRef(photoUrl)}
              draggable
              onDragStart={() => setDraggedPhotoUrl(photoUrl)}
              onDragEnd={() => setDraggedPhotoUrl(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (draggedPhotoUrl && draggedPhotoUrl !== photoUrl) {
                  onReorderPhoto(draggedPhotoUrl, photoUrl);
                }
                setDraggedPhotoUrl(null);
              }}
              onClick={() => {
                if (selectedPhotoUrl && selectedPhotoUrl !== photoUrl) {
                  onReorderPhoto(selectedPhotoUrl, photoUrl);
                  setSelectedPhotoUrl(null);
                  return;
                }

                setSelectedPhotoUrl((prev) => (prev === photoUrl ? null : photoUrl));
              }}
              className={`overflow-hidden rounded-xl border bg-gray-950 transition ${
                draggedPhotoUrl === photoUrl
                  ? 'scale-[0.98] border-blue-500/60 opacity-70'
                  : selectedPhotoUrl === photoUrl
                    ? 'border-blue-400/70 ring-2 ring-blue-500/20'
                    : 'border-gray-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-gray-800 px-2 py-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-gray-700 bg-gray-900 px-1 text-[10px] font-semibold text-gray-200">
                    {index + 1}
                  </span>
                  <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-wide ${
                    photos[0] === photoUrl
                      ? 'bg-emerald-500/15 text-emerald-200'
                      : 'bg-gray-800 text-gray-400'
                  }`}>
                    {photos[0] === photoUrl ? 'Головне фото' : 'Фото'}
                  </span>
                </div>
                {selectedPhotoUrl === photoUrl ? (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-300">Обрано</span>
                ) : null}
              </div>
              <div
              >
                <a
                  href={photoUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="block aspect-square bg-gray-900"
                >
                  <img src={photoUrl} alt="Фото товару" className="h-full w-full object-cover" />
                </a>
              </div>
              <div className="space-y-2 px-2 py-2">
                <div className="flex items-center justify-between gap-2">
                  <a
                    href={photoUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="truncate text-[11px] text-blue-300 hover:text-blue-200"
                  >
                    Відкрити
                  </a>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemovePhoto(photoUrl);
                    }}
                    disabled={isSubmitting}
                    className="rounded-md px-2 py-1 text-xs text-red-300 transition hover:bg-red-900/30 disabled:opacity-50"
                  >
                    Видалити
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
