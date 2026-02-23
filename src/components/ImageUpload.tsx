interface Props {
  onUpload: (src: string) => void;
}

export function ImageUpload({ onUpload }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpload(URL.createObjectURL(file));
  };

  return <input type="file" accept="image/*" onChange={handleChange} />;
}
