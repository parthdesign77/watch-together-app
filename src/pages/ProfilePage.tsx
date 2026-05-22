import { Camera, Crown, Mail, User, Edit2, Check, X, Sparkles, Shield, Compass, Heart, Loader2 } from "lucide-react";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useRef } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useUiStore } from "../store/uiStore";
import { motion, AnimatePresence } from "framer-motion";

export function ProfilePage() {
  const { profile } = useAuth();
  const pushToast = useUiStore((state) => state.pushToast);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Canvas Image Crop States
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);

  // Preloaded High-Res Avatars
  const premiumAvatars = [
    { name: "Neon Gamer Felix", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix" },
    { name: "Cyber Anya", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Anya" },
    { name: "Cool Nerd Jack", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Jack" },
    { name: "Retro Girl Zoe", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe" },
    { name: "Cyber Hunter Liam", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Liam" },
    { name: "Cosmic Spark Aurora", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Aurora" },
    { name: "Neon Space Explorer", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80" },
    { name: "Cybernetic Aurora", url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&auto=format&fit=crop&q=80" }
  ];

  // Initialize values when opening edit mode or when profile changes
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setAvatar(profile.avatar || "");
      setSelectedImage(null);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    }
  }, [profile, isEditing]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      pushToast({ title: "File too large", description: "Please upload an image smaller than 5MB.", type: "error" });
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      pushToast({ title: "Invalid file type", description: "Only JPG, PNG, and WEBP are supported.", type: "error" });
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

  const handleSave = async () => {
    if (!profile) return;
    if (!name.trim()) {
      pushToast({ title: "Name cannot be empty", description: "Please enter a valid display name.", type: "error" });
      return;
    }

    setIsSaving(true);
    try {
      let finalAvatar = avatar;

      if (selectedImage) {
        finalAvatar = await new Promise<string>((resolve, reject) => {
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

              const cropSize = 256;
              canvas.width = cropSize;
              canvas.height = cropSize;

              ctx.fillStyle = "#111111";
              ctx.fillRect(0, 0, cropSize, cropSize);

              const size = Math.min(img.width, img.height);
              const sWidth = size / zoom;
              const sHeight = size / zoom;
              
              const dragScale = size / 200; // matching cropper container size
              const sx = (img.width - sWidth) / 2 - (offset.x * dragScale);
              const sy = (img.height - sHeight) / 2 - (offset.y * dragScale);

              ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, cropSize, cropSize);
              
              const base64Url = canvas.toDataURL("image/jpeg", 0.8);
              resolve(base64Url);
            } catch (err) {
              reject(err);
            }
          };
          img.onerror = () => reject(new Error("Could not load preview image."));
        });
      }

      await updateDoc(doc(db, "users", profile.uid), {
        name: name.trim(),
        username: username.trim(),
        bio: bio.trim(),
        avatar: finalAvatar,
        updatedAt: Date.now()
      });
      
      pushToast({ title: "Profile updated!", description: "Your custom changes have been saved and synced in real-time.", type: "success" });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      pushToast({ title: "Error saving profile", description: "Something went wrong, please try again.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header section */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-panel/90 to-panel/40 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-premium/15 blur-3xl" />
        
        <AnimatePresence mode="wait">
          {!isEditing ? (
            <motion.div
              key="view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6 md:flex-row md:items-center"
            >
              <div className="relative group">
                <div className="border-4 border-white/10 ring-4 ring-premium/20 group-hover:scale-105 transition-all duration-300 shadow-2xl rounded-full overflow-hidden animate-fade-in">
                  <Avatar user={profile} size="lg" />
                </div>
                {profile?.subscriptionPlan === "premium" && (
                  <div className="absolute -bottom-1 -right-1 bg-gradient-to-tr from-amber-500 to-yellow-300 p-1.5 rounded-full border-2 border-panel shadow-lg">
                    <Crown className="h-4 w-4 text-black fill-black" />
                  </div>
                )}
              </div>
              
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-4xl font-black text-white tracking-tight">{profile?.name}</h1>
                  {profile?.username && (
                    <span className="font-mono text-sm text-[#ff3d47] font-bold bg-[#ff3d47]/10 px-2 py-0.5 rounded-md border border-[#ff3d47]/20">
                      @{profile.username}
                    </span>
                  )}
                  {profile?.subscriptionPlan === "premium" ? (
                    <Badge tone="purple" className="px-3 py-1 font-bold shadow-lg shadow-purple-500/10">
                      <Crown className="h-3.5 w-3.5 mr-1" />
                      Premium Account
                    </Badge>
                  ) : profile?.subscriptionPlan === "standard" ? (
                    <Badge tone="cyan" className="px-3 py-1 font-bold shadow-lg shadow-cyan/10">
                      <Sparkles className="h-3.5 w-3.5 mr-1" />
                      Standard Account
                    </Badge>
                  ) : (
                    <Badge tone="muted" className="px-3 py-1 font-semibold">
                      Free Account
                    </Badge>
                  )}
                  {profile?.role === "admin" && (
                    <Badge tone="red" className="font-extrabold flex items-center gap-1 shadow-glow-sm">
                      Admin
                    </Badge>
                  )}
                </div>
                <div className="flex flex-col gap-2.5">
                  <p className="flex items-center gap-2 text-sm text-neutral-400">
                    <Mail className="h-4 w-4 text-neutral-500" />
                    {profile?.email}
                  </p>
                  {profile?.bio && (
                    <p className="text-sm italic text-neutral-300 max-w-xl pl-3 border-l-2 border-[#ff3d47]/40 py-0.5 bg-white/2 rounded-r-md pr-2">
                      "{profile.bio}"
                    </p>
                  )}
                </div>
              </div>
              
              <Button onClick={() => setIsEditing(true)} className="md:self-center h-11 px-5 bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 text-white rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all duration-200">
                <Edit2 className="h-4 w-4" />
                Customize Profile
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-premium" />
                  <h2 className="text-xl font-bold text-white">Customize Your Profile</h2>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)} className="rounded-lg">
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving} className="rounded-lg bg-[#ff3d47] hover:bg-[#ff3d47]/90 text-white shadow-md shadow-[#ff3d47]/10">
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    Save Profile
                  </Button>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {/* Left col: Avatar preview & Photo Upload Crop box */}
                <div className="space-y-4 md:col-span-1 border-r border-white/5 pr-0 md:pr-6">
                  <label className="block text-xs font-black uppercase tracking-wider text-neutral-400">Profile Photo</label>
                  
                  {!selectedImage ? (
                    <div className="flex flex-col items-center justify-center bg-white/2 border border-white/5 rounded-2xl p-6 text-center">
                      <div className="relative h-28 w-28 rounded-full border-4 border-premium/30 bg-elevated shadow-xl overflow-hidden mb-4 flex items-center justify-center">
                        {avatar ? (
                          <img src={avatar} alt="Preview" className="h-full w-full object-cover" />
                        ) : (
                          <Avatar user={profile} size="lg" />
                        )}
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/png, image/jpeg, image/webp" 
                        className="hidden" 
                      />
                      <Button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-10 px-4 bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 text-white rounded-xl flex items-center gap-2"
                      >
                        <Camera className="h-4 w-4" />
                        Upload Custom Photo
                      </Button>
                      <p className="text-[10px] text-neutral-500 mt-2">JPG, PNG, WEBP. Max 5MB.</p>
                    </div>
                  ) : (
                    /* Crop Box Editor */
                    <div className="glass p-4 rounded-2xl border border-[#ff3d47]/20 bg-[#ff3d47]/5 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-wider text-red-300">Crop & Zoom Editor</span>
                        <button 
                          onClick={() => setSelectedImage(null)} 
                          className="text-xs text-neutral-400 hover:text-white underline"
                        >
                          Cancel Upload
                        </button>
                      </div>
                      
                      <div 
                        ref={cropContainerRef}
                        className="h-48 w-full rounded-xl bg-neutral-950 border border-white/10 relative overflow-hidden flex items-center justify-center touch-none select-none cursor-move"
                        onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
                        onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
                        onMouseUp={handleDragEnd}
                        onMouseLeave={handleDragEnd}
                      >
                        <img 
                          src={selectedImage} 
                          alt="Source" 
                          className="max-h-full max-w-full pointer-events-none"
                          style={{
                            transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`,
                            transformOrigin: "center",
                            transition: dragStart ? "none" : "transform 0.15s ease-out"
                          }}
                        />
                        <div className="absolute h-32 w-32 rounded-full border-2 border-dashed border-[#ff3d47] pointer-events-none shadow-[0_0_0_9999px_rgba(3,3,3,0.7)]" />
                      </div>

                      {/* Zoom slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-neutral-400">
                          <span>ZOOM</span>
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
                </div>

                {/* Right col: Name, Username, Bio, preset seed grid */}
                <div className="md:col-span-2 space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-neutral-400">Display Name</label>
                      <input
                        type="text"
                        maxLength={24}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-base text-snow placeholder:text-muted outline-none focus:border-[#ff3d47] transition duration-200"
                        placeholder="e.g. Cinema Friend"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-neutral-400">Username</label>
                      <input
                        type="text"
                        maxLength={18}
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                        className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-base text-snow placeholder:text-muted outline-none focus:border-[#ff3d47] transition duration-200 font-mono"
                        placeholder="username"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-neutral-400">Bio Description</label>
                    <textarea
                      maxLength={140}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-snow placeholder:text-muted outline-none focus:border-[#ff3d47] transition duration-200 resize-none"
                      placeholder="Tell friends about your taste..."
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-black uppercase tracking-wider text-neutral-400">Or Select High-Res Preset Seed</label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                      {premiumAvatars.map((item) => {
                        const isSelected = avatar === item.url && !selectedImage;
                        return (
                          <div
                            key={item.name}
                            onClick={() => {
                              setAvatar(item.url);
                              setSelectedImage(null); // choosing preset overrides uploads
                            }}
                            className={`relative aspect-square rounded-xl overflow-hidden bg-elevated border-2 transition-all duration-300 cursor-pointer ${
                              isSelected
                                ? "border-[#ff3d47] scale-105 shadow-lg shadow-[#ff3d47]/15 ring-2 ring-[#ff3d47]/20"
                                : "border-white/10 hover:border-white/20 hover:scale-102"
                            }`}
                          >
                            <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 bg-[#ff3d47] text-white p-0.5 rounded-full">
                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Accomplishments Grid */}
      <section className="grid gap-5 md:grid-cols-3">
        {[
          { label: "Active Rooms Joined", value: profile?.recentRooms?.length || 0, icon: Compass, color: "text-cyan bg-cyan/10 border-cyan/20" },
          { label: "Saved in Watchlist", value: profile?.watchlist?.length || 0, icon: Heart, color: "text-pink-500 bg-pink-500/10 border-pink-500/20" },
          { label: "Subscription Status", value: profile?.subscriptionPlan || "free", icon: Shield, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" }
        ].map((item) => (
          <article 
            key={item.label} 
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-panel p-6 shadow-xl transition-all duration-300 hover:border-white/15 hover:shadow-2xl hover:y-[-2px]"
          >
            <div className={`absolute top-6 right-6 p-2.5 rounded-xl border ${item.color} transition-transform duration-300 group-hover:scale-110`}>
              <item.icon className="h-5 w-5" />
            </div>
            
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{item.label}</p>
            <p className="mt-4 text-4xl font-black text-white capitalize tracking-tight">{item.value}</p>
            
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-cyan to-premium" 
                style={{ width: item.value ? "100%" : "0%" }}
              />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
