import { ChangeEvent, useRef, useState } from 'react';

type ImageUploaderProps = {
  label: string;
  value?: string | null;
  onChange: (file: File | null) => void;
  accept?: string;
  id?: string;
  buttonText?: string;
};

export default function ImageUploader({
  label,
  value,
  onChange,
  accept = 'image/jpeg,image/png,image/webp,image/jpg',
  id,
  buttonText,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value ?? null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      onChange(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    onChange(file);
  };

  const triggerPicker = () => inputRef.current?.click();

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileSelect}
      />
      <button
        type="button"
        onClick={triggerPicker}
        className="w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        {buttonText ?? 'Upload Photo'}
      </button>
      {previewUrl ? <img src={previewUrl} alt={label} className="h-28 w-full rounded-lg object-cover" /> : null}
    </div>
  );
}
