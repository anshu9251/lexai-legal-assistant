import React, { forwardRef, useImperativeHandle, useRef } from 'react';

const UploadZone = forwardRef(({ onUpload }, ref) => {
  const fileInputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    triggerUpload: () => {
      fileInputRef.current?.click();
    }
  }));

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional client-side validation logic or pass directly to parent
    // The previous implementation threw an error if it was > 20MB.
    // The caller of uploadFile expects standard file picking.
    
    // We will just call the passed onUpload, which expects a file object
    try {
      await onUpload(file);
    } catch (err) {
      console.error(err);
    }
    
    // Reset file input so the same file can be selected again
    e.target.value = null;
  };

  return (
    <input 
      type="file" 
      accept=".pdf,.docx"
      style={{ display: 'none' }}
      ref={fileInputRef}
      onChange={handleFileChange}
    />
  );
});

UploadZone.displayName = 'UploadZone';
export default UploadZone;
