import React, { useState, useEffect, useRef } from "react";
import { X, Camera, Check, Loader2, Sparkles, User, Info, FileText, Settings, ShieldAlert, Crown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "./Button";
import { Avatar } from "./Avatar";
import { Badge } from "./Badge";
import { db } from "../../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useUiStore } from "../../store/uiStore";
import { motion, AnimatePresence } from "framer-motion";

interface MobileProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export function MobileProfileModal({ open, onClose }: MobileProfileModalProps) {
  const { profile } = useAuth();
  const pushToast = useUiStore((state) => state.pushToast);

  // States
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // Crop States
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);

  // Sync state with profile
  useEffect(() => {
    if (profile && open) {
      setName(profile.name || "");
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setSelectedImage(null);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setUploadProgress(0);
      setIsUploading(false);
    }
  }, [profile, open]);

  // Handle local file picking
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      pushToast({ title: "File too large", description: "Please upload an image smaller than 5MB.", type: "error" });
      return;
    }

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      pushToast({ title: "Invalid file type", description: "Only JPG, PNG, WEBP, and GIF are supported.", type: "error" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  // Touch/Mouse dragging inside cropper
  const handleDragStart = (clientX: number, clientY: number) => {
    if (!selectedImage) return;
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!dragStart) return;
    setOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handleDragEnd = () => {
    setDragStart(null);
  };

  // Perform Canvas crop & save
  const handleSave = async () => {
    if (!profile) return;
    if (!name.trim()) {
      pushToast({ title: "Name cannot be empty", description: "Please enter a valid display name.", type: "error" });
      return;
    }

    setIsSaving(true);
    setIsUploading(true);

    try {
      let finalAvatarUrl = profile.avatar || "";

      // If an image was loaded and edited, crop it on canvas
      if (selectedImage) {
        // Animate upload progress beautifully
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 15;
          });
        }, 100);

        finalAvatarUrl = await new Promise<string>((resolve, reject) => {
          const img = new Image();
          img.src = selectedImage;
          img.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              if (!ctx) {
                reject(new Error("Could not get 2D canvas context."));
                return;
              }

              // Set square dimension for avatar crop
              const cropSize = 256;
              canvas.width = cropSize;
              canvas.height = cropSize;

              // Draw circular path (optional, let's keep canvas standard square and let CSS circle mask it, WebP/JPEG is smaller)
              ctx.fillStyle = "#111111";
              ctx.fillRect(0, 0, cropSize, cropSize);

              // Calculate crop dimension relative to canvas
              const size = Math.min(img.width, img.height);
              
              // Apply scaling and offsets
              // Zoom scaling relative to original center crop
              const sWidth = size / zoom;
              const sHeight = size / zoom;
              
              // Shift sx/sy relative to image aspect ratio and dragging
              const dragScale = size / 200; // 200px is the cropper container display box size
              const sx = (img.width - sWidth) / 2 - (offset.x * dragScale);
              const sy = (img.height - sHeight) / 2 - (offset.y * dragScale);

              ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, cropSize, cropSize);
              
              // Compress to 80% WebP if supported, or JPEG
              const base64Url = canvas.toDataURL("image/jpeg", 0.8);
              clearInterval(progressInterval);
              setUploadProgress(100);
              resolve(base64Url);
            } catch (err) {
              clearInterval(progressInterval);
              reject(err);
            }
          };
          img.onerror = () => {
            clearInterval(progressInterval);
            reject(new Error("Could not load selected preview."));
          };
        });
      }

      // Update Firestore user document
      await updateDoc(doc(db, "users", profile.uid), {
        name: name.trim(),
        username: username.trim(),
        bio: bio.trim(),
        avatar: finalAvatarUrl,
        updatedAt: Date.now()
      });

      pushToast({ title: "Profile saved!", description: "Your custom mobile profile details have updated instantly.", type: "success" });
      onClose();
    } catch (err) {
      console.error(err);
      pushToast({ title: "Failed to update profile", description: "Something went wrong. Check file format.", type: "error" });
    } finally {
      setIsSaving(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-[#030303]/95 lg:hidden overflow-y-auto"
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-white/10 bg-neutral-950 px-4">
            <div className="flex items-center gap-2.5">
              <Settings className="h-5 w-5 text-[#ff3d47]" />
              <h2 className="font-display text-lg font-black text-white">Profile Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-neutral-400 hover:text-white"
              aria-label="Close settings"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 space-y-6 px-4 py-6 pb-28">
            
            {/* Visual Identity Section */}
            <div className="flex flex-col items-center justify-center bg-gradient-to-b from-white/5 to-transparent rounded-3xl p-5 border border-white/5 text-center">
              
              {/* Circular Avatar Frame */}
              <div className="relative group mb-4">
                <div className="h-24 w-24 rounded-full border-4 border-[#ff3d47]/20 shadow-2xl overflow-hidden relative bg-neutral-900 flex items-center justify-center">
                  {selectedImage ? (
                    <div className="h-full w-full relative">
                      <img 
                        src={selectedImage} 
                        alt="Crop Preview" 
                        className="h-full w-full object-cover" 
                        style={{
                          transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`,
                          transformOrigin: "center"
                        }}
                      />
                    </div>
                  ) : (
                    <Avatar user={profile} size="lg" />
                  )}

                  {/* Upload Progress Overlay */}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                      <Loader2 className="h-6 w-6 text-[#ff3d47] animate-spin mb-1" />
                      <span className="text-[10px] font-mono font-bold text-white">{uploadProgress}%</span>
                    </div>
                  )}
                </div>
                
                {/* Floating camera trigger */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-gradient-to-tr from-[#ff3d47] to-red-500 text-white shadow-lg border border-[#ff3d47]/30 active:scale-90 transition-transform"
                  aria-label="Change photo"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/png, image/jpeg, image/webp" 
                className="hidden" 
              />

              <div className="space-y-1.5 mb-2">
                <h3 className="text-base font-extrabold text-white">{profile?.name}</h3>
                <p className="text-xs text-neutral-400 font-medium font-mono">@{profile?.username || "no-username"}</p>
              </div>

              {/* Sub status */}
              <div className="flex gap-2">
                <Badge tone={profile?.premiumBadge ? "purple" : profile?.subscriptionPlan === "standard" ? "cyan" : "muted"}>
                  {profile?.subscriptionPlan || "free"} Account
                </Badge>
                {profile?.role === "admin" && (
                  <Badge tone="red" className="font-extrabold flex items-center gap-1 shadow-glow-sm">
                    Admin
                  </Badge>
                )}
              </div>
            </div>

            {/* Interactive Image Cropper Control Box */}
            {selectedImage && (
              <div className="glass p-4 rounded-2xl border border-[#ff3d47]/20 bg-[#ff3d47]/5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-wider text-red-300">Crop & Zoom Editor</span>
                  <button 
                    onClick={() => setSelectedImage(null)} 
                    className="text-xs text-neutral-400 hover:text-white underline"
                  >
                    Cancel Photo
                  </button>
                </div>
                
                {/* Visual Crop Box Container */}
                <div 
                  ref={cropContainerRef}
                  className="h-52 w-full rounded-xl bg-neutral-950 border border-white/10 relative overflow-hidden flex items-center justify-center touch-none select-none cursor-move"
                  onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
                  onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
                  onMouseUp={handleDragEnd}
                  onMouseLeave={handleDragEnd}
                  onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
                  onTouchMove={(e) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY)}
                  onTouchEnd={handleDragEnd}
                >
                  <img 
                    ref={imageRef}
                    src={selectedImage} 
                    alt="Source" 
                    className="max-h-full max-w-full pointer-events-none"
                    style={{
                      transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`,
                      transformOrigin: "center",
                      transition: dragStart ? "none" : "transform 0.15s ease-out"
                    }}
                  />

                  {/* Circular Crop Frame overlay */}
                  <div className="absolute h-36 w-36 rounded-full border-2 border-dashed border-[#ff3d47] pointer-events-none shadow-[0_0_0_9999px_rgba(3,3,3,0.7)]" />
                  <div className="absolute text-[10px] text-red-300 font-bold uppercase pointer-events-none bg-black/60 px-2 py-0.5 rounded-full border border-red-500/20 top-2">
                    Drag to adjust crop center
                  </div>
                </div>

                {/* Zoom range slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-neutral-400">
                    <span>ZOOM RANGE</span>
                    <span className="font-mono text-red-300">{zoom.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full accent-[#ff3d47]"
                  />
                </div>
              </div>
            )}

            {/* Editable Fields form */}
            <div className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Display Name
                </span>
                <input
                  type="text"
                  maxLength={24}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cinema Ninja"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-snow focus:border-[#ff3d47] outline-none transition-colors"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Username
                </span>
                <input
                  type="text"
                  maxLength={18}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                  placeholder="username"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-snow focus:border-[#ff3d47] outline-none transition-colors font-mono"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Bio Description
                </span>
                <textarea
                  maxLength={140}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell friends about your taste..."
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-snow focus:border-[#ff3d47] outline-none transition-colors resize-none"
                />
              </label>

              <div className="space-y-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" />
                  Account Details
                </span>
                <div className="rounded-xl border border-white/5 bg-white/2 p-4 space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Email Address</span>
                    <span className="text-snow font-medium select-all">{profile?.email}</span>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Joined Date</span>
                    <span className="text-snow font-mono font-medium">
                      {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" }) : "Recently"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Fixed bottom Save triggers */}
          <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-white/10 bg-neutral-950 px-4 py-4 safe-bottom">
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                className="flex-1 h-12 rounded-xl text-neutral-300 hover:text-white"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 h-12 rounded-xl bg-[#ff3d47] hover:bg-[#ff3d47]/90 text-white font-extrabold flex items-center justify-center gap-2 border-none shadow-glow-sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4.5 w-4.5 stroke-[2.5]" />
                    <span>Save Changes</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
