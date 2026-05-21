import { Camera, Crown, Mail, User, Edit2, Check, X, Sparkles, Shield, Compass, Heart, Loader2 } from "lucide-react";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useUiStore } from "../store/uiStore";
import { motion, AnimatePresence } from "framer-motion";

export function ProfilePage() {
  const { profile } = useAuth();
  const pushToast = useUiStore((state) => state.pushToast);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Preloaded High-Res Avatars
  const premiumAvatars = [
    { name: "Neon Gamer Felix", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix" },
    { name: "Cyber Punk Anya", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Anya" },
    { name: "Cool Nerd Jack", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Jack" },
    { name: "Retro Girl Zoe", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe" },
    { name: "Future Robo Mech", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Robo1" },
    { name: "Cyber Aurora Kitty", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Kitty" },
    { name: "Neon Space Explorer", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80" },
    { name: "Cybernetic Aurora", url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&auto=format&fit=crop&q=80" }
  ];

  // Initialize values when opening edit mode
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setAvatar(profile.avatar || "");
      // If profile.avatar is not one of the preloaded ones, set it as custom
      const isPreloaded = premiumAvatars.some(a => a.url === profile.avatar);
      if (profile.avatar && !isPreloaded) {
        setCustomAvatarUrl(profile.avatar);
      } else {
        setCustomAvatarUrl("");
      }
    }
  }, [profile, isEditing]);

  const handleSave = async () => {
    if (!profile) return;
    if (!name.trim()) {
      pushToast({ title: "Name cannot be empty", description: "Please enter a valid name.", type: "error" });
      return;
    }

    setIsSaving(true);
    try {
      const finalAvatar = customAvatarUrl.trim() || avatar;
      await updateDoc(doc(db, "users", profile.uid), {
        name: name.trim(),
        avatar: finalAvatar
      });
      
      pushToast({ title: "Profile updated!", description: "Your profile changes have been saved and synced in real-time.", type: "success" });
      setIsEditing(false);
    } catch (err) {
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
                </div>
                <p className="flex items-center gap-2 text-sm text-muted">
                  <Mail className="h-4 w-4 text-muted" />
                  {profile?.email}
                </p>
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
                  <h2 className="text-xl font-bold text-white">Edit Your Premium Identity</h2>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)} className="rounded-lg">
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving} className="rounded-lg bg-gradient-to-r from-cyan to-blue-600 hover:from-cyan/90 hover:to-blue-600/90 text-white shadow-md shadow-cyan/10">
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
                {/* Left col: Avatar preview & Custom URL */}
                <div className="space-y-4 md:col-span-1 border-r border-white/5 pr-0 md:pr-6">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted">Avatar Live Preview</label>
                  <div className="flex flex-col items-center justify-center bg-white/2 border border-white/5 rounded-2xl p-6 text-center">
                    <div className="relative h-28 w-28 rounded-full border-4 border-premium/30 bg-elevated shadow-xl overflow-hidden mb-3">
                      <img 
                        src={customAvatarUrl.trim() || avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix"} 
                        alt="Preview" 
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix";
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-snow bg-premium/10 px-2 py-0.5 rounded border border-premium/20">
                      {customAvatarUrl.trim() ? "Custom Image URL" : "Selected Seed"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted">Or Paste Custom Image URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={customAvatarUrl}
                      onChange={(e) => setCustomAvatarUrl(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-snow placeholder:text-muted outline-none focus:border-cyan transition duration-200"
                    />
                    <p className="text-[10px] text-muted">Supports raw link formats (Unsplash, Imgur, Discord CDN, etc.)</p>
                  </div>
                </div>

                {/* Right col: Display Name & Grid Selector */}
                <div className="md:col-span-2 space-y-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted">Display Name</label>
                    <input
                      type="text"
                      maxLength={24}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-base text-snow placeholder:text-muted outline-none focus:border-cyan transition duration-200"
                      placeholder="Your ninja name..."
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted">Select High-Res Avatar Seed</label>
                    <div className="grid grid-cols-4 gap-3">
                      {premiumAvatars.map((item) => {
                        const isSelected = avatar === item.url && !customAvatarUrl.trim();
                        return (
                          <div
                            key={item.name}
                            onClick={() => {
                              setAvatar(item.url);
                              setCustomAvatarUrl(""); // Reset custom URL when choosing preloaded
                            }}
                            className={`relative aspect-square rounded-xl overflow-hidden bg-elevated border-2 transition-all duration-300 cursor-pointer ${
                              isSelected
                                ? "border-cyan scale-105 shadow-lg shadow-cyan/15 ring-2 ring-cyan/20"
                                : "border-white/10 hover:border-white/20 hover:scale-102"
                            }`}
                          >
                            <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 bg-cyan text-black p-0.5 rounded-full">
                                <Check className="h-3 w-3 stroke-[3]" />
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
