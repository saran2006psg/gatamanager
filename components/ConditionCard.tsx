import type { FailureCondition } from '@/types/dataset';

type ConditionCardProps = {
  condition: FailureCondition;
  label: string;
  description: string;
  onUpload: (condition: FailureCondition, file: File) => void;
  currentFiles: Array<{ name: string; path: string; id?: string }>; 
  onDelete: (id?: string, condition?: FailureCondition) => void;
  onNoteUpdate?: (id: string, note: string) => void;
  isCompleted: boolean;
};

export default function ConditionCard({
  condition,
  label,
  description,
  onUpload,
  currentFiles,
  onDelete,
  onNoteUpdate,
  isCompleted,
}: ConditionCardProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onUpload(condition, file);
    event.target.value = '';
  };

  return (
    <div className={`rounded-xl border p-4 ${isCompleted ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">{label}</h3>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        <div className={`rounded-full px-2 py-1 text-xs font-medium ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          {isCompleted ? 'Completed' : 'Pending'}
        </div>
      </div>

      <div className="mt-4">
        <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
          <input type="file" accept="image/jpeg,image/png,image/webp,image/jpg" className="hidden" onChange={handleFileChange} />
          Take Photo / Upload From Device
        </label>
      </div>

      {currentFiles.length > 0 ? (
        <div className="mt-4 space-y-3">
          {currentFiles.map((file, index) => (
            <div key={`${file.id ?? file.path ?? index}`} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-start gap-3">
                <img src={file.path} alt={file.name} className="h-20 w-20 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-700">{file.name}</div>
                  <div className="mt-1 text-xs text-slate-500">Uploaded</div>
                  {onNoteUpdate && file.id ? (
                    <textarea
                      rows={2}
                      className="mt-2 w-full rounded border border-slate-200 px-2 py-1 text-xs"
                      placeholder="Optional note"
                      defaultValue=""
                      onBlur={(event) => onNoteUpdate(file.id!, event.target.value)}
                    />
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(file.id, condition)}
                  className="text-xs font-medium text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
