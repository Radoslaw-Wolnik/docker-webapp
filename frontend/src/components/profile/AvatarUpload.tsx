import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, User, X } from 'lucide-react';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import { profileApi } from '../../api/api';
import { useAuthStore } from '../../stores/auth.store';
import toast from 'react-hot-toast';

const AvatarUpload: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await profileApi.updateAvatar(formData);
      if (response.success) {
        const newAvatarUrl = response.data!.avatarUrl;
        
        // Update user in store
        setUser({
          ...user!,
          avatarUrl: newAvatarUrl,
        });
        
        toast.success('Avatar updated successfully!');
      }
    } catch (error: any) {
      toast.error(error.error || 'Failed to upload avatar');
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  }, [user, setUser]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const handleRemoveAvatar = async () => {
    try {
      // You would need to implement this endpoint on backend
      // For now, just clear locally
      setUser({
        ...user!,
        avatarUrl: undefined,
      });
      setPreview(null);
      toast.success('Avatar removed');
    } catch (error) {
      toast.error('Failed to remove avatar');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Profile Picture
      </h3>
      
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Current Avatar */}
        <div className="relative">
          <Avatar
            src={preview || user?.avatarUrl}
            alt={user?.username || 'User'}
            size="xl"
          />
          
          {user?.avatarUrl && !preview && (
            <button
              onClick={handleRemoveAvatar}
              className="absolute -top-1 -right-1 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Upload Zone */}
        <div className="flex-1">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
              transition-all duration-200
              ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} disabled={isUploading} />
            
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-sm text-gray-600">Uploading...</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-3">
                  {isDragActive ? (
                    <Upload className="w-6 h-6 text-primary-600" />
                  ) : (
                    <User className="w-6 h-6 text-primary-600" />
                  )}
                </div>
                
                <p className="text-sm text-gray-700 mb-1">
                  {isDragActive ? 'Drop image here' : 'Drag & drop an image here'}
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  or click to select a file
                </p>
                
                <Button
                  size="sm"
                  variant="outline"
                  className="mx-auto"
                >
                  Choose Image
                </Button>
              </>
            )}
          </div>
          
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <p>• Supported formats: JPG, PNG, GIF, WebP</p>
            <p>• Maximum file size: 5MB</p>
            <p>• Recommended size: 200×200 pixels</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarUpload;