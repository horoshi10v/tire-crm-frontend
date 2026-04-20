import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@tire-crm/shared';
import { extractPhotoUrl, moveItemByOffset, reorderItems } from './helpers';
import type { LotFormState, PendingPhotoUpload, SetLotFormState, UploadPhotoResponse } from './types';

type UseLotPhotoUploadArgs = {
  isSubmitting: boolean;
  setForm: SetLotFormState;
  setFormError: (value: string | null) => void;
};

export default function useLotPhotoUpload({ isSubmitting, setForm, setFormError }: UseLotPhotoUploadArgs) {
  const [uploadingPhotosCount, setUploadingPhotosCount] = useState(0);
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0 });
  const [pendingPhotoUploads, setPendingPhotoUploads] = useState<PendingPhotoUpload[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const pendingPhotoUploadsRef = useRef<PendingPhotoUpload[]>([]);

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await apiClient.post<UploadPhotoResponse>('/staff/lots/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return extractPhotoUrl(data ?? {});
    },
  });

  useEffect(() => {
    pendingPhotoUploadsRef.current = pendingPhotoUploads;
  }, [pendingPhotoUploads]);

  useEffect(() => {
    return () => {
      pendingPhotoUploadsRef.current.forEach((upload) => URL.revokeObjectURL(upload.previewUrl));
    };
  }, []);

  const isUploadingPhotos = uploadingPhotosCount > 0;
  const hasActiveUploadProgress = uploadProgress.total > 0 && uploadProgress.completed < uploadProgress.total;

  const handleFilesUpload = async (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    const nextPendingUploads = files.map((file, index) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
      fileName: file.name,
      previewUrl: URL.createObjectURL(file),
      status: 'uploading' as const,
    }));

    try {
      setFormError(null);
      setUploadingPhotosCount(files.length);
      setUploadProgress({ completed: 0, total: files.length });
      setPendingPhotoUploads((prev) => [...prev, ...nextPendingUploads]);

      const uploadResults = await Promise.allSettled(
        files.map(async (file, index) => {
          try {
            const uploadedUrl = await uploadPhotoMutation.mutateAsync(file);
            return { uploadedUrl, pendingId: nextPendingUploads[index].id };
          } finally {
            setUploadProgress((prev) => ({ ...prev, completed: prev.completed + 1 }));
          }
        }),
      );

      const uploadedUrls = uploadResults.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
      const currentPendingOrder = pendingPhotoUploadsRef.current.map((upload) => upload.id);
      const orderedUploadedUrls = [...uploadedUrls].sort(
        (left, right) => currentPendingOrder.indexOf(left.pendingId) - currentPendingOrder.indexOf(right.pendingId),
      );

      setForm((prev: LotFormState) => {
        if (orderedUploadedUrls.length === 0) {
          return prev;
        }

        const nextPhotos = [...prev.photos];
        for (const { uploadedUrl } of orderedUploadedUrls) {
          if (!nextPhotos.includes(uploadedUrl)) {
            nextPhotos.push(uploadedUrl);
          }
        }

        return { ...prev, photos: nextPhotos };
      });

      setPendingPhotoUploads((prev) =>
        prev.flatMap((upload) => {
          const successMatch = uploadedUrls.find((item) => item.pendingId === upload.id);
          if (successMatch) {
            URL.revokeObjectURL(upload.previewUrl);
            return [];
          }

          const uploadFailed = nextPendingUploads.some((pendingUpload) => pendingUpload.id === upload.id);
          if (uploadFailed) {
            return [{ ...upload, status: 'error' as const }];
          }

          return [upload];
        }),
      );

      if (uploadedUrls.length !== files.length) {
        setFormError(`Завантажено ${uploadedUrls.length} з ${files.length} фото. Спробуйте повторити для решти.`);
      }
    } catch {
      setFormError('Не вдалося завантажити фото. Спробуйте ще раз.');
      setPendingPhotoUploads((prev) =>
        prev.map((upload) =>
          nextPendingUploads.some((pendingUpload) => pendingUpload.id === upload.id)
            ? { ...upload, status: 'error' }
            : upload,
        ),
      );
    } finally {
      setUploadingPhotosCount(0);
      setTimeout(() => {
        setUploadProgress({ completed: 0, total: 0 });
      }, 1200);
    }
  };

  const handleUploadPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    await handleFilesUpload(files);
  };

  const handleDropPhotos = async (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    if (isSubmitting || isUploadingPhotos) {
      return;
    }
    const files = Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith('image/'));
    await handleFilesUpload(files);
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (!isSubmitting && !isUploadingPhotos) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handlePendingPhotoMove = (fromId: string, toId: string) => {
    setPendingPhotoUploads((prev) => {
      const fromItem = prev.find((item) => item.id === fromId);
      const toItem = prev.find((item) => item.id === toId);
      if (!fromItem || !toItem) {
        return prev;
      }
      return reorderItems(prev, fromItem, toItem);
    });
  };

  const handlePendingPhotoShift = (pendingId: string, direction: -1 | 1) => {
    setPendingPhotoUploads((prev) => {
      const pendingItem = prev.find((item) => item.id === pendingId);
      if (!pendingItem) {
        return prev;
      }
      return moveItemByOffset(prev, pendingItem, direction);
    });
  };

  return {
    uploadPhotoMutation,
    isUploadingPhotos,
    uploadingPhotosCount,
    uploadProgress,
    hasActiveUploadProgress,
    pendingPhotoUploads,
    isDragOver,
    handleUploadPhoto,
    handleDropPhotos,
    handleDragOver,
    handleDragLeave,
    handlePendingPhotoMove,
    handlePendingPhotoShift,
  };
}
