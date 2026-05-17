"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Camera, User, Mail, BookOpen, Save } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../utils/supabase";
import { customPopup } from "../context/PopupContext";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageUpdate?: (imageUrl: string) => void;
  storageKey?: string;
  profileData?: any;
  userRole?: 'admin' | 'guru' | 'siswa';
}

export function AccountModal({ isOpen, onClose, onImageUpdate, storageKey = "profileImage", profileData, userRole }: AccountModalProps) {
  const { user, updateProfile, refreshUser } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(() => {
    return user?.avatar || localStorage.getItem(storageKey) || null;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [className, setClassName] = useState<string>("Loading...");

  useEffect(() => {
    if (user?.avatar) {
      setProfileImage(user.avatar);
    }
  }, [user?.avatar]);

  useEffect(() => {
    const loadClassName = async () => {
      if (profileData?.classId) {
        try {
          const { data: classData } = await supabase
            .from('classes')
            .select('name')
            .eq('id', profileData.classId)
            .single();
          setClassName(classData?.name || 'Belum ada kelas');
        } catch (error) {
          console.error("Failed to load class name:", error);
          setClassName('Belum ada kelas');
        }
      } else {
        setClassName('Belum ada kelas');
      }
    };

    if (userRole === 'siswa') {
      loadClassName();
    }
  }, [profileData?.classId, userRole]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        await customPopup.alert('Hanya file gambar yang diperbolehkan', 'warning');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        await customPopup.alert('Ukuran file maksimal 2MB', 'warning');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        setProfileImage(base64String);
      };
      reader.onerror = async () => {
        console.error("Failed to read file");
        await customPopup.alert('Gagal membaca file. Silakan coba lagi.', 'error');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsUploading(true);
    try {
      if (user?.id) {
        // Update avatar in Supabase via AuthContext
        await updateProfile({ avatar: profileImage });
        await refreshUser();
      }

      if (onImageUpdate) {
        onImageUpdate(profileImage || "");
      }
      
      await customPopup.alert("Profil berhasil diperbarui!", 'success');
      onClose();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      await customPopup.alert(error.message || "Gagal menyimpan perubahan. Ukuran file mungkin terlalu besar.", 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    const isConfirmed = await customPopup.confirm("Apakah Anda yakin ingin menghapus foto profil?", 'warning');
    if (!isConfirmed) return;
    
    setIsUploading(true);
    try {
      if (user?.id) {
        await updateProfile({ avatar: null });
        setProfileImage(null);
        await refreshUser();
      }

      if (onImageUpdate) {
        onImageUpdate("");
      }
      
      await customPopup.alert("Foto profil berhasil dihapus!", 'success');
    } catch (error: any) {
      console.error('Error removing profile image:', error);
      await customPopup.alert("Gagal menghapus foto profil.", 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-white rounded-[35px] shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#f59e0b] to-[#f97316] h-[120px] px-[40px] flex items-center justify-between">
              <div>
                <h2 className="font-['Poppins'] font-bold text-[32px] text-white uppercase tracking-[1.2px]">
                  AKUN SAYA
                </h2>
                <p className="font-['Poppins'] text-[14px] text-white/90">
                  Kelola Informasi Dan Foto Profil Anda
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-[40px] h-[40px] bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
              >
                <X className="w-[24px] h-[24px] text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-[40px] overflow-y-auto h-[calc(100%-120px)]">
              <div className="flex gap-[40px]">
                {/* Left Side - Profile Picture */}
                <div className="flex-shrink-0">
                  <div className="text-center">
                    <div className="relative inline-block mb-[24px]">
                      {/* Profile Picture */}
                      <div className="w-[180px] h-[180px] rounded-full overflow-hidden border-4 border-[#f59e0b] shadow-lg relative">
                        {profileImage ? (
                          <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#ffcb14] flex items-center justify-center">
                            <span className="font-['Inter'] font-medium text-[72px] text-white">A</span>
                          </div>
                        )}
                      </div>

                      {/* Camera Button */}
                      <button
                        onClick={handleImageClick}
                        className="absolute bottom-[10px] right-[10px] w-[45px] h-[45px] bg-gradient-to-r from-[#f59e0b] to-[#f97316] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all group"
                      >
                        <Camera className="w-[22px] h-[22px] text-white group-hover:scale-110 transition-transform" />
                      </button>

                      {/* Hidden File Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </div>

                    <p className="font-['Poppins'] font-semibold text-[16px] text-[#1e293b] mb-[6px]">
                      Foto Profil
                    </p>
                    <p className="font-['Poppins'] text-[12px] text-[#64748b] mb-[16px]">
                      Klik ikon kamera untuk mengubah foto
                    </p>

                    {/* Buttons Container */}
                    <div className="flex flex-col gap-2">
                      {profileImage && (
                        <motion.button
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          onClick={handleSave}
                          disabled={isUploading}
                          className="bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-['Poppins'] font-semibold text-[13px] px-[28px] py-[10px] rounded-full flex items-center gap-[8px] hover:shadow-lg transition-all mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUploading ? (
                            <>
                              <div className="w-[14px] h-[14px] border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Menyimpan...
                            </>
                          ) : (
                            <>
                              <Save className="w-[14px] h-[14px]" />
                              Simpan Foto
                            </>
                          )}
                        </motion.button>
                      )}

                      {user?.avatar && (
                        <motion.button
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          onClick={handleRemoveImage}
                          disabled={isUploading}
                          className="text-[#ef4444] font-['Poppins'] font-semibold text-[12px] px-[28px] py-[8px] rounded-full hover:bg-red-50 transition-all mx-auto disabled:opacity-50"
                        >
                          Hapus Foto
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side - Account Info */}
                <div className="flex-1">
                  <h3 className="font-['Poppins'] font-bold text-[22px] text-[#1e293b] mb-[20px]">
                    Informasi Akun
                  </h3>

                  <div className="space-y-[16px]">
                    {/* Name */}
                    <div className="p-[18px] bg-[#f8fafc] rounded-[12px] border border-[#e2e8f0]">
                      <div className="flex items-center gap-[10px] mb-[6px]">
                        <div className="w-[32px] h-[32px] bg-[#dbeafe] rounded-[8px] flex items-center justify-center">
                          <User className="w-[16px] h-[16px] text-[#1294f2]" />
                        </div>
                        <p className="font-['Poppins'] font-semibold text-[13px] text-[#64748b]">Nama Lengkap</p>
                      </div>
                      <p className="font-['Poppins'] font-medium text-[16px] text-[#1e293b] ml-[42px]">
                        {profileData?.name || 'Loading...'}
                      </p>
                      <p className="font-['Poppins'] text-[11px] text-[#94a3b8] ml-[42px] mt-[3px]">
                        {userRole === 'siswa' ? 'Nama tidak dapat diubah oleh siswa' : 'Nama pengguna sistem'}
                      </p>
                    </div>

                    {/* Email */}
                    <div className="p-[18px] bg-[#f8fafc] rounded-[12px] border border-[#e2e8f0]">
                      <div className="flex items-center gap-[10px] mb-[6px]">
                        <div className="w-[32px] h-[32px] bg-[#f3e8ff] rounded-[8px] flex items-center justify-center">
                          <Mail className="w-[16px] h-[16px] text-[#8b5cf6]" />
                        </div>
                        <p className="font-['Poppins'] font-semibold text-[13px] text-[#64748b]">Email</p>
                      </div>
                      <p className="font-['Poppins'] font-medium text-[16px] text-[#1e293b] ml-[42px]">
                        {profileData?.email || 'Loading...'}
                      </p>
                    </div>

                    {/* Class/Role-specific info */}
                    {(userRole === 'siswa' || userRole === 'guru') && (
                      <div className="p-[18px] bg-[#f8fafc] rounded-[12px] border border-[#e2e8f0]">
                        <div className="flex items-center gap-[10px] mb-[6px]">
                          <div className="w-[32px] h-[32px] bg-[#dcfce7] rounded-[8px] flex items-center justify-center">
                            <BookOpen className="w-[16px] h-[16px] text-[#10b981]" />
                          </div>
                          <p className="font-['Poppins'] font-semibold text-[13px] text-[#64748b]">
                            {userRole === 'siswa' ? 'Kelas' : 'Role'}
                          </p>
                        </div>
                        <p className="font-['Poppins'] font-medium text-[16px] text-[#1e293b] ml-[42px]">
                          {userRole === 'siswa' 
                            ? className
                            : (profileData?.role || 'Guru')
                          }
                        </p>
                        <p className="font-['Poppins'] text-[11px] text-[#94a3b8] ml-[42px] mt-[3px]">
                          {userRole === 'siswa' ? 'Kelas diatur oleh admin sekolah' : 'Peran pengguna'}
                        </p>
                      </div>
                    )}
                    
                    {userRole === 'admin' && profileData?.statistics && (
                      <div className="p-[18px] bg-[#f8fafc] rounded-[12px] border border-[#e2e8f0]">
                        <div className="flex items-center gap-[10px] mb-[6px]">
                          <div className="w-[32px] h-[32px] bg-[#dcfce7] rounded-[8px] flex items-center justify-center">
                            <BookOpen className="w-[16px] h-[16px] text-[#10b981]" />
                          </div>
                          <p className="font-['Poppins'] font-semibold text-[13px] text-[#64748b]">Statistik</p>
                        </div>
                        <div className="ml-[42px] space-y-[8px]">
                          <p className="font-['Poppins'] font-medium text-[14px] text-[#1e293b]">
                            {profileData?.statistics?.totalClasses || 0} Kelas
                          </p>
                          <p className="font-['Poppins'] font-medium text-[14px] text-[#1e293b]">
                            {profileData?.statistics?.totalTeachers || 0} Guru
                          </p>
                          <p className="font-['Poppins'] font-medium text-[14px] text-[#1e293b]">
                            {profileData?.statistics?.totalStudents || 0} Siswa
                          </p>
                        </div>
                        <p className="font-['Poppins'] text-[11px] text-[#94a3b8] ml-[42px] mt-[8px]">
                          Total data dalam sistem
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Info Box */}
                  <div className="mt-[20px] p-[14px] bg-[#eff6ff] border-l-4 border-[#1294f2] rounded-[8px]">
                    <p className="font-['Poppins'] text-[12px] text-[#1e40af] leading-[1.5]">
                      <strong>💡 Informasi:</strong> Hanya foto profil yang dapat diubah oleh siswa. Untuk mengubah
                      nama, email, atau kelas, silakan hubungi administrator sekolah.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}