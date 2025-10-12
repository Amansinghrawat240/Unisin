"use client";

import { useEffect, useState } from "react";
import { Plus, Eye, EyeOff, Pencil, Trash2, Save, X, Search, Music, FileEdit, Upload, Users, ListPlus, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { AddSectionDialog } from "./add-section-dialog";
import AddContentDialog from "./add-content-dialog";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SectionItem {
  id: number;
  itemType: "playlist" | "track" | "artist";
  itemId: number;
  position: number;
  details: any;
}

interface Section {
  id: number;
  title: string;
  subtitle: string | null;
  type: "playlist_carousel" | "track_grid" | "artist_grid";
  position: number;
  isVisible: boolean;
  items: SectionItem[];
}

type TabType = "sections" | "music" | "artists" | "history";

export function EditorDashboard() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("sections");
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSection, setShowAddSection] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [showAddContent, setShowAddContent] = useState(false);
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSubtitle, setEditSubtitle] = useState("");
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editItemDesc, setEditItemDesc] = useState("");
  const [editItemCover, setEditItemCover] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);

  // BETTER-AUTH: Check authentication and role
  useEffect(() => {
    if (isPending) return;
    
    if (!session?.user) {
      toast.error("Please login to access the editor");
      router.push("/login?redirect=/editor");
      return;
    }

    // Type assertion for role property which exists at runtime
    const userRole = (session.user as any).role;
    if (userRole !== 'admin' && userRole !== 'editor') {
      toast.error("You don't have permission to access the editor");
      router.push("/");
      return;
    }
    
    loadSections();
  }, [session, isPending, router]);

  const loadSections = async () => {
    try {
      setLoading(true);
      
      const res = await fetch("/api/editor/sections?include_hidden=true", {
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to load sections");
      }

      const data = await res.json();
      setSections(data);
    } catch (error: any) {
      console.error("Load sections error:", error);
      toast.error(error.message || "Failed to load sections");
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (section: Section) => {
    try {
      const res = await fetch(`/api/editor/sections/${section.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isVisible: !section.isVisible }),
      });

      if (!res.ok) throw new Error("Failed to update visibility");

      toast.success(`Section ${!section.isVisible ? "shown" : "hidden"}`);
      loadSections();
    } catch (error) {
      toast.error("Failed to update visibility");
    }
  };

  const deleteSection = async (sectionId: number) => {
    if (!confirm("Delete this section? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/editor/sections/${sectionId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Delete error:", errorData);
        throw new Error(errorData.error || "Failed to delete section");
      }

      toast.success("Section deleted");
      loadSections();
    } catch (error: any) {
      console.error("Delete section error:", error);
      toast.error(error.message || "Failed to delete section");
    }
  };

  const startEdit = (section: Section) => {
    setEditingSection(section.id);
    setEditTitle(section.title);
    setEditSubtitle(section.subtitle || "");
  };

  const saveEdit = async (sectionId: number) => {
    try {
      const res = await fetch(`/api/editor/sections/${sectionId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editTitle,
          subtitle: editSubtitle || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to update section");

      toast.success("Section updated");
      setEditingSection(null);
      loadSections();
    } catch (error) {
      toast.error("Failed to update section");
    }
  };

  const startItemEdit = (item: SectionItem) => {
    setEditingItem(item.id);
    setEditItemDesc(item.details?.description || "");
    setEditItemCover(item.details?.coverUrl || item.details?.imageUrl || "");
  };

  const saveItemEdit = async (sectionId: number, itemId: number) => {
    try {
      const res = await fetch(`/api/editor/sections/${sectionId}/items/${itemId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customDescription: editItemDesc.trim() || null,
          customCoverUrl: editItemCover.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to update item");

      toast.success("Item updated");
      setEditingItem(null);
      loadSections();
    } catch (error) {
      toast.error("Failed to update item");
    }
  };

  const removeItem = async (sectionId: number, itemId: number) => {
    if (!confirm("Remove this item from the section?")) return;

    try {
      const res = await fetch(`/api/editor/sections/${sectionId}/items/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to remove item");

      toast.success("Item removed");
      loadSections();
    } catch (error) {
      toast.error("Failed to remove item");
    }
  };

  const handleItemClick = (item: SectionItem) => {
    if (editingItem === item.id) return; // Don't navigate if editing
    
    switch (item.itemType) {
      case "playlist":
        router.push(`/playlists/${item.itemId}`);
        break;
      case "track":
        // For tracks, you could navigate to a track detail page or trigger play
        toast.info("Track playback coming soon");
        break;
      case "artist":
        // Navigate to artist page using slug if available
        const artistSlug = item.details?.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        if (artistSlug) {
          router.push(`/artists/${artistSlug}`);
        }
        break;
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5MB or less");
      return;
    }

    try {
      setUploadingCover(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await res.json();
      setEditItemCover(data.url);
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploadingCover(false);
    }
  };

  const getSectionTypeLabel = (type: string) => {
    switch (type) {
      case "playlist_carousel":
        return "Playlist Carousel";
      case "track_grid":
        return "Track Grid";
      case "artist_grid":
        return "Artist Grid";
      default:
        return type;
    }
  };

  // Show loading while checking auth
  if (isPending || !session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-white/10">
        <button
          onClick={() => setActiveTab("sections")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition border-b-2 ${
            activeTab === "sections"
              ? "border-primary text-white"
              : "border-transparent text-white/60 hover:text-white"
          }`}
        >
          <GripVertical className="h-4 w-4" />
          Homepage Sections
        </button>
        <button
          onClick={() => setActiveTab("music")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition border-b-2 ${
            activeTab === "music"
              ? "border-primary text-white"
              : "border-transparent text-white/60 hover:text-white"
          }`}
        >
          <Music className="h-4 w-4" />
          Music Manager
        </button>
        <button
          onClick={() => setActiveTab("artists")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition border-b-2 ${
            activeTab === "artists"
              ? "border-primary text-white"
              : "border-transparent text-white/60 hover:text-white"
          }`}
        >
          <Users className="h-4 w-4" />
          Artists
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition border-b-2 ${
            activeTab === "history"
              ? "border-primary text-white"
              : "border-transparent text-white/60 hover:text-white"
          }`}
        >
          History & Undo
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "sections" && (
        <HomepageSectionsTab
          sections={sections}
          loading={loading}
          showAddSection={showAddSection}
          setShowAddSection={setShowAddSection}
          toggleVisibility={toggleVisibility}
          deleteSection={deleteSection}
          startEdit={startEdit}
          editingSection={editingSection}
          editTitle={editTitle}
          setEditTitle={setEditTitle}
          editSubtitle={editSubtitle}
          setEditSubtitle={setEditSubtitle}
          saveEdit={saveEdit}
          setEditingSection={setEditingSection}
          setSelectedSection={setSelectedSection}
          setShowAddContent={setShowAddContent}
          removeItem={removeItem}
          getSectionTypeLabel={getSectionTypeLabel}
          selectedSection={selectedSection}
          showAddContent={showAddContent}
          loadSections={loadSections}
          editingItem={editingItem}
          startItemEdit={startItemEdit}
          saveItemEdit={saveItemEdit}
          setEditingItem={setEditingItem}
          editItemDesc={editItemDesc}
          setEditItemDesc={setEditItemDesc}
          editItemCover={editItemCover}
          setEditItemCover={setEditItemCover}
          uploadingCover={uploadingCover}
          setUploadingCover={setUploadingCover}
          handleItemClick={handleItemClick}
        />
      )}

      {activeTab === "music" && <MusicManagerTab />}

      {activeTab === "artists" && <ArtistsManagerTab />}

      {activeTab === "history" && (
        <div className="rounded-lg border border-white/10 bg-[#181818] p-12 text-center">
          <h3 className="text-lg font-semibold mb-2">History & Undo</h3>
          <p className="text-white/60">Coming soon...</p>
        </div>
      )}
    </div>
  );
}

// Homepage Sections Tab Component
function HomepageSectionsTab(props: any) {
  const {
    sections,
    loading,
    showAddSection,
    setShowAddSection,
    toggleVisibility,
    deleteSection,
    startEdit,
    editingSection,
    editTitle,
    setEditTitle,
    editSubtitle,
    setEditSubtitle,
    saveEdit,
    setEditingSection,
    setSelectedSection,
    setShowAddContent,
    removeItem,
    getSectionTypeLabel,
    selectedSection,
    showAddContent,
    loadSections,
    editingItem,
    startItemEdit,
    saveItemEdit,
    setEditingItem,
    editItemDesc,
    setEditItemDesc,
    editItemCover,
    setEditItemCover,
    uploadingCover,
    setUploadingCover,
    handleItemClick,
  } = props;

  const [localSections, setLocalSections] = useState<Section[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPosition, setEditingPosition] = useState<number | null>(null);
  const [tempPosition, setTempPosition] = useState<string>("");

  // Sync sections to local state
  useEffect(() => {
    setLocalSections(sections);
  }, [sections]);

  const handlePositionChange = async (sectionId: number, newPosition: number) => {
    if (newPosition < 1 || newPosition > localSections.length) {
      toast.error(`Position must be between 1 and ${localSections.length}`);
      return;
    }

    const sectionIndex = localSections.findIndex((s) => s.id === sectionId);
    if (sectionIndex === -1) return;

    // Create a new array with updated positions
    const updatedSections = [...localSections];
    const [movedSection] = updatedSections.splice(sectionIndex, 1);
    updatedSections.splice(newPosition - 1, 0, movedSection);

    // Update all positions
    const sectionsWithNewPositions = updatedSections.map((section, index) => ({
      ...section,
      position: index + 1,
    }));

    // Optimistically update UI
    setLocalSections(sectionsWithNewPositions);
    setEditingPosition(null);

    // Save to server
    try {
      setIsSaving(true);
      const token = localStorage.getItem("bearer_token");
      
      const res = await fetch("/api/editor/sections/reorder", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sections: sectionsWithNewPositions.map((s) => ({
            id: s.id,
            position: s.position,
          })),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to reorder sections");
      }

      toast.success("Sections reordered successfully");
      loadSections();
    } catch (error: any) {
      toast.error(error.message || "Failed to reorder sections");
      // Revert on error
      setLocalSections(sections);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/60">Loading editor...</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Homepage Editor</h1>
          <p className="text-white/60 mt-1">
            Create and manage sections that appear on your homepage - just like UniSin. Enter position number to reorder.
          </p>
        </div>
        <button
          onClick={() => setShowAddSection(true)}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-black hover:brightness-110 transition"
        >
          <Plus className="h-4 w-4" />
          Add Section
        </button>
      </div>

      {localSections.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-[#181818] p-12 text-center">
          <h3 className="text-lg font-semibold mb-2">No sections yet</h3>
          <p className="text-white/60 mb-4">
            Create your first homepage section to start curating content
          </p>
          <button
            onClick={() => setShowAddSection(true)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-black hover:brightness-110 transition"
          >
            <Plus className="h-4 w-4" />
            Create Section
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {localSections.map((section: any) => (
            <SectionCard
              key={section.id}
              section={section}
              toggleVisibility={toggleVisibility}
              deleteSection={deleteSection}
              startEdit={startEdit}
              editingSection={editingSection}
              editTitle={editTitle}
              setEditTitle={setEditTitle}
              editSubtitle={editSubtitle}
              setEditSubtitle={setEditSubtitle}
              saveEdit={saveEdit}
              setEditingSection={setEditingSection}
              setSelectedSection={setSelectedSection}
              setShowAddContent={setShowAddContent}
              removeItem={removeItem}
              getSectionTypeLabel={getSectionTypeLabel}
              editingItem={editingItem}
              startItemEdit={startItemEdit}
              saveItemEdit={saveItemEdit}
              setEditingItem={setEditingItem}
              editItemDesc={editItemDesc}
              setEditItemDesc={setEditItemDesc}
              editItemCover={editItemCover}
              setEditItemCover={setEditItemCover}
              handleItemClick={handleItemClick}
              isSaving={isSaving}
              editingPosition={editingPosition}
              setEditingPosition={setEditingPosition}
              tempPosition={tempPosition}
              setTempPosition={setTempPosition}
              handlePositionChange={handlePositionChange}
              totalSections={localSections.length}
            />
          ))}
        </div>
      )}

      {showAddSection && (
        <AddSectionDialog
          onClose={() => setShowAddSection(false)}
          onSuccess={() => {
            setShowAddSection(false);
            loadSections();
          }}
        />
      )}

      {showAddContent && selectedSection && (
        <AddContentDialog
          sectionId={selectedSection.id}
          sectionTitle={selectedSection.title}
          sectionType={selectedSection.type}
          open={showAddContent}
          onClose={() => {
            setShowAddContent(false);
            setSelectedSection(null);
          }}
          onSuccess={() => {
            setShowAddContent(false);
            setSelectedSection(null);
            loadSections();
          }}
        />
      )}
    </>
  );
}

// Section Card Component (without drag-and-drop)
function SectionCard(props: any) {
  const {
    section,
    toggleVisibility,
    deleteSection,
    startEdit,
    editingSection,
    editTitle,
    setEditTitle,
    editSubtitle,
    setEditSubtitle,
    saveEdit,
    setEditingSection,
    setSelectedSection,
    setShowAddContent,
    removeItem,
    getSectionTypeLabel,
    editingItem,
    startItemEdit,
    saveItemEdit,
    setEditingItem,
    editItemDesc,
    setEditItemDesc,
    editItemCover,
    setEditItemCover,
    handleItemClick,
    isSaving,
    editingPosition,
    setEditingPosition,
    tempPosition,
    setTempPosition,
    handlePositionChange,
    totalSections,
  } = props;

  const [localItems, setLocalItems] = useState<SectionItem[]>([]);
  const [isSavingItems, setIsSavingItems] = useState(false);
  const [editingItemPosition, setEditingItemPosition] = useState<number | null>(null);
  const [tempItemPosition, setTempItemPosition] = useState<string>("");

  // Sync items to local state
  useEffect(() => {
    setLocalItems(section.items || []);
  }, [section.items]);

  const handleItemPositionChange = async (itemId: number, newPosition: number) => {
    if (newPosition < 1 || newPosition > localItems.length) {
      toast.error(`Position must be between 1 and ${localItems.length}`);
      return;
    }

    const itemIndex = localItems.findIndex((item) => item.id === itemId);
    if (itemIndex === -1) return;

    // Create a new array with updated positions
    const updatedItems = [...localItems];
    const [movedItem] = updatedItems.splice(itemIndex, 1);
    updatedItems.splice(newPosition - 1, 0, movedItem);

    // Update all positions
    const itemsWithNewPositions = updatedItems.map((item, index) => ({
      ...item,
      position: index + 1,
    }));

    // Optimistically update UI
    setLocalItems(itemsWithNewPositions);
    setEditingItemPosition(null);

    // Save to server
    try {
      setIsSavingItems(true);
      const token = localStorage.getItem("bearer_token");
      
      const res = await fetch(`/api/editor/sections/${section.id}/items/reorder`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: itemsWithNewPositions.map((item) => ({
            id: item.id,
            position: item.position,
          })),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to reorder items");
      }

      toast.success("Items reordered successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to reorder items");
      // Revert on error
      setLocalItems(section.items || []);
    } finally {
      setIsSavingItems(false);
    }
  };

  return (
    <div className="rounded-lg border border-white/10 bg-[#181818] p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          {/* Position Number Input */}
          <div className="mt-1">
            {editingPosition === section.id ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={tempPosition}
                  onChange={(e) => setTempPosition(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const pos = parseInt(tempPosition);
                      if (!isNaN(pos)) {
                        handlePositionChange(section.id, pos);
                      }
                    } else if (e.key === "Escape") {
                      setEditingPosition(null);
                    }
                  }}
                  onBlur={() => {
                    const pos = parseInt(tempPosition);
                    if (!isNaN(pos)) {
                      handlePositionChange(section.id, pos);
                    } else {
                      setEditingPosition(null);
                    }
                  }}
                  min={1}
                  max={totalSections}
                  className="w-12 bg-[#282828] border border-primary rounded px-2 py-1 text-sm text-white text-center"
                  autoFocus
                />
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditingPosition(section.id);
                  setTempPosition(section.position.toString());
                }}
                className="w-12 h-8 bg-[#282828] hover:bg-[#333] border border-white/20 rounded px-2 py-1 text-sm text-white/60 hover:text-white transition text-center"
                title="Click to change position"
              >
                #{section.position}
              </button>
            )}
          </div>
          
          <div className="flex-1">
            {editingSection === section.id ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#282828] border border-white/20 rounded px-3 py-1.5 text-white"
                  placeholder="Section title"
                />
                <input
                  type="text"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  className="w-full bg-[#282828] border border-white/20 rounded px-3 py-1.5 text-white/80 text-sm"
                  placeholder="Subtitle (optional)"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(section.id)}
                    className="flex items-center gap-1 text-xs text-primary hover:brightness-110"
                  >
                    <Save className="h-3 w-3" />
                    Save
                  </button>
                  <button
                    onClick={() => setEditingSection(null)}
                    className="flex items-center gap-1 text-xs text-white/60 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold">{section.title}</h3>
                {section.subtitle && (
                  <p className="text-white/60 text-sm">{section.subtitle}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-white/40">
                    {getSectionTypeLabel(section.type)}
                  </span>
                  {!section.isVisible && (
                    <span className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded">
                      Hidden
                    </span>
                  )}
                  {isSaving && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                      Saving...
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleVisibility(section)}
            className="p-2 hover:bg-white/10 rounded transition"
            title={section.isVisible ? "Hide section" : "Show section"}
          >
            {section.isVisible ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4 text-white/40" />
            )}
          </button>
          <button
            onClick={() => startEdit(section)}
            className="p-2 hover:bg-white/10 rounded transition"
            title="Edit section"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => deleteSection(section.id)}
            className="p-2 hover:bg-red-500/20 text-red-500 rounded transition"
            title="Delete section"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/60">
              {localItems.length} item{localItems.length !== 1 ? "s" : ""}
            </span>
            {isSavingItems && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                Saving order...
              </span>
            )}
          </div>
          <button
            onClick={() => {
              setSelectedSection(section);
              setShowAddContent(true);
            }}
            className="text-xs text-primary hover:brightness-110"
          >
            + Add Content
          </button>
        </div>

        {localItems.length === 0 ? (
          <div className="text-center py-6 text-white/40 text-sm">
            No content yet. Click "Add Content" to add playlists, tracks, or artists.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {localItems.map((item: any) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="group relative rounded-lg bg-[#282828] p-3 hover:bg-[#333] transition cursor-pointer"
              >
                {editingItem === item.id ? (
                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    {/* Cover Image Upload */}
                    <div className="space-y-2">
                      {editItemCover && (
                        <div className="relative w-full aspect-square rounded overflow-hidden">
                          <img
                            src={editItemCover}
                            alt="Cover preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => setEditItemCover("")}
                            className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-500 rounded"
                            title="Remove image"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      <label className="flex items-center justify-center gap-2 w-full bg-[#181818] border border-white/20 rounded px-2 py-2 text-xs text-white cursor-pointer hover:bg-[#222] transition">
                        <Upload className="h-3 w-3" />
                        {editItemCover ? "Change Cover" : "Upload Cover"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (!file.type.startsWith("image/")) {
                              toast.error("Please select an image file");
                              return;
                            }
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error("Image must be 5MB or less");
                              return;
                            }
                            const formData = new FormData();
                            formData.append("file", file);
                            fetch("/api/upload", { method: "POST", body: formData })
                              .then(async (res) => {
                                if (!res.ok) {
                                  const error = await res.json();
                                  throw new Error(error.error || "Upload failed");
                                }
                                return res.json();
                              })
                              .then((data) => {
                                setEditItemCover(data.url);
                                toast.success("Image uploaded");
                              })
                              .catch((error: any) => {
                                toast.error(error.message || "Upload failed");
                              });
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <textarea
                      value={editItemDesc}
                      onChange={(e) => setEditItemDesc(e.target.value)}
                      placeholder="Custom description for homepage"
                      rows={3}
                      className="w-full bg-[#181818] border border-white/20 rounded px-2 py-1 text-xs text-white resize-none"
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={() => saveItemEdit(section.id, item.id)}
                        className="flex-1 bg-primary text-black text-xs py-1 rounded hover:brightness-110"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingItem(null)}
                        className="flex-1 bg-white/10 text-white text-xs py-1 rounded hover:bg-white/20"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Item Position Input */}
                    <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                      {editingItemPosition === item.id ? (
                        <input
                          type="number"
                          value={tempItemPosition}
                          onChange={(e) => setTempItemPosition(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const pos = parseInt(tempItemPosition);
                              if (!isNaN(pos)) {
                                handleItemPositionChange(item.id, pos);
                              }
                            } else if (e.key === "Escape") {
                              setEditingItemPosition(null);
                            }
                          }}
                          onBlur={() => {
                            const pos = parseInt(tempItemPosition);
                            if (!isNaN(pos)) {
                              handleItemPositionChange(item.id, pos);
                            } else {
                              setEditingItemPosition(null);
                            }
                          }}
                          min={1}
                          max={localItems.length}
                          className="w-8 bg-black/80 border border-primary rounded px-1 py-0.5 text-xs text-white text-center"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setEditingItemPosition(item.id);
                            setTempItemPosition(item.position.toString());
                          }}
                          className="w-8 h-6 bg-black/60 hover:bg-black/80 border border-white/30 rounded px-1 text-xs text-white/80 hover:text-white transition text-center"
                          title="Click to change position"
                        >
                          #{item.position}
                        </button>
                      )}
                    </div>

                    {item.details?.coverUrl || item.details?.imageUrl ? (
                      <img
                        src={item.details.coverUrl || item.details.imageUrl}
                        alt={item.details.title || item.details.name}
                        className="w-full aspect-square object-cover rounded mb-2"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-white/10 rounded mb-2 flex items-center justify-center text-white/40 text-xs">
                        No image
                      </div>
                    )}
                    <p className="text-sm font-medium truncate">
                      {item.details?.title || item.details?.name || "Unknown"}
                    </p>
                    {item.details?.description && (
                      <p className="text-xs text-white/60 line-clamp-2 mt-1">
                        {item.details.description}
                      </p>
                    )}
                    <p className="text-xs text-white/40 capitalize mt-1">{item.itemType}</p>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startItemEdit(item);
                        }}
                        className="p-1 bg-black/60 hover:bg-primary rounded"
                        title="Edit description & cover"
                      >
                        <FileEdit className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(section.id, item.id);
                        }}
                        className="p-1 bg-black/60 hover:bg-red-500 rounded"
                        title="Remove from section"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Music Manager Tab Component
function MusicManagerTab() {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [localPlaylists, setLocalPlaylists] = useState<any[]>([]);
  const [searchTracks, setSearchTracks] = useState<any[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any | null>(null);
  const [expandedPlaylist, setExpandedPlaylist] = useState<number | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<Record<number, any[]>>({});
  const [loadingTracks, setLoadingTracks] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [editingPosition, setEditingPosition] = useState<number | null>(null);
  const [tempPosition, setTempPosition] = useState<string>("");

  // Sync playlists to local state
  useEffect(() => {
    setLocalPlaylists(playlists);
  }, [playlists]);

  const handlePositionChange = async (playlistId: number, newPosition: number) => {
    if (newPosition < 1 || newPosition > localPlaylists.length) {
      toast.error(`Position must be between 1 and ${localPlaylists.length}`);
      return;
    }

    const playlistIndex = localPlaylists.findIndex((p) => p.id === playlistId);
    if (playlistIndex === -1) return;

    // Create a new array with updated positions
    const updatedPlaylists = [...localPlaylists];
    const [movedPlaylist] = updatedPlaylists.splice(playlistIndex, 1);
    updatedPlaylists.splice(newPosition - 1, 0, movedPlaylist);

    // Update all positions
    const playlistsWithNewPositions = updatedPlaylists.map((playlist, index) => ({
      ...playlist,
      position: index + 1,
    }));

    // Optimistically update UI
    setLocalPlaylists(playlistsWithNewPositions);
    setEditingPosition(null);

    // Save to server
    try {
      setIsSavingOrder(true);
      const token = localStorage.getItem("bearer_token");
      
      const res = await fetch("/api/playlists/reorder", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          playlists: playlistsWithNewPositions.map((p) => ({
            id: p.id,
            position: p.position,
          })),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to reorder playlists");
      }

      toast.success("Playlists reordered successfully");
      loadPlaylists();
    } catch (error: any) {
      toast.error(error.message || "Failed to reorder playlists");
      // Revert on error
      setLocalPlaylists(playlists);
    } finally {
      setIsSavingOrder(false);
    }
  };

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("bearer_token");
      const adminEmail = localStorage.getItem("admin_email");
      
      // Load playlists owned by UniSin system user (shared across all editors)
      const res = await fetch("/api/playlists?userId=unisin-system&limit=100", {
        credentials: "include",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "x-test-user-email": adminEmail || "",
        },
        cache: "no-store",
      });
      
      if (!res.ok) throw new Error("Failed to load playlists");
      const data = await res.json();
      
      // All playlists are owned by UniSin system user
      setPlaylists(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Failed to load playlists");
    } finally {
      setLoading(false);
    }
  };

  const loadPlaylistTracks = async (playlistId: number) => {
    if (playlistTracks[playlistId]) {
      // Already loaded, just toggle
      return;
    }

    try {
      setLoadingTracks(playlistId);
      const token = localStorage.getItem("bearer_token");
      const res = await fetch(`/api/playlists/${playlistId}`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error("Failed to load tracks");
      const data = await res.json();
      
      setPlaylistTracks((prev) => ({
        ...prev,
        [playlistId]: data.tracks || [],
      }));
    } catch (error) {
      toast.error("Failed to load playlist tracks");
    } finally {
      setLoadingTracks(null);
    }
  };

  const togglePlaylist = async (playlistId: number) => {
    if (expandedPlaylist === playlistId) {
      setExpandedPlaylist(null);
    } else {
      setExpandedPlaylist(playlistId);
      await loadPlaylistTracks(playlistId);
    }
  };

  const deleteTrackFromPlaylist = async (playlistId: number, trackId: number, trackTitle: string) => {
    if (!confirm(`Remove "${trackTitle}" from this playlist?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch(`/api/playlists/${playlistId}/tracks?trackId=${trackId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to remove track");
      }

      toast.success("Track removed from playlist");
      
      // Update local state
      setPlaylistTracks((prev) => ({
        ...prev,
        [playlistId]: prev[playlistId]?.filter((t) => t.track.id !== trackId) || [],
      }));
      
      // Refresh playlists to update track count
      loadPlaylists();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove track");
    }
  };

  const searchMusic = async (query: string) => {
    if (!query.trim()) {
      setSearchTracks([]);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=track`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSearchTracks(data.results || []);
    } catch (error) {
      toast.error("Search failed");
    }
  };

  const createPlaylist = async () => {
    if (!newPlaylistTitle.trim()) {
      toast.error("Please enter a playlist title");
      return;
    }
    try {
      const token = localStorage.getItem("bearer_token");
      const adminEmail = localStorage.getItem("admin_email");
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-test-user-email": adminEmail || "",
          "x-system-user": "unisin-system", // Use UniSin system user for editor playlists
        },
        body: JSON.stringify({ 
          title: newPlaylistTitle,
          isPublic: true // Make playlists public by default in Music Manager
        }),
      });
      if (!res.ok) throw new Error("Failed to create playlist");
      const data = await res.json();
      toast.success("Playlist created!");
      setNewPlaylistTitle("");
      setShowCreatePlaylist(false);
      
      // Optimistically add the new playlist to the list
      if (data && data.id) {
        setPlaylists((prev) => [data, ...prev]);
      }
      
      loadPlaylists();
    } catch (error) {
      toast.error("Failed to create playlist");
    }
  };

  const deletePlaylist = async (playlistId: number, playlistTitle: string) => {
    if (!confirm(`Delete playlist "${playlistTitle}"? This cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("bearer_token");
      const adminEmail = localStorage.getItem("admin_email");

      const res = await fetch(`/api/playlists/${playlistId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-test-user-email": adminEmail || "",
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete playlist");
      }

      toast.success("Playlist deleted successfully");
      
      // Clear selection if deleted playlist was selected
      if (selectedPlaylist?.id === playlistId) {
        setSelectedPlaylist(null);
      }
      
      loadPlaylists();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete playlist");
    }
  };

  const addTrackToPlaylist = async (trackId: number) => {
    if (!selectedPlaylist) {
      toast.error("Please select a playlist first");
      return;
    }
    try {
      const token = localStorage.getItem("bearer_token");
      const adminEmail = localStorage.getItem("admin_email");
      const res = await fetch(`/api/playlists/${selectedPlaylist.id}/tracks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-test-user-email": adminEmail || "",
        },
        body: JSON.stringify({ trackId }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || "Failed to add track");
      }
      
      toast.success("Track added to playlist!");
    } catch (error: any) {
      toast.error(error.message || "Failed to add track");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/60">Loading music manager...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Music Manager</h1>
          <p className="text-white/60 mt-1">Create playlists and add music. Enter position number to reorder.</p>
        </div>
        <button
          onClick={() => setShowCreatePlaylist(true)}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-black hover:brightness-110 transition"
        >
          <Plus className="h-4 w-4" />
          Create Playlist
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Playlists Panel */}
        <div className="rounded-lg border border-white/10 bg-[#181818] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Your Playlists</h2>
            {isSavingOrder && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                Saving order...
              </span>
            )}
          </div>
          {localPlaylists.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <p>No playlists yet</p>
              <button
                onClick={() => setShowCreatePlaylist(true)}
                className="mt-4 text-primary hover:brightness-110"
              >
                Create your first playlist
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {localPlaylists.map((playlist) => (
                <PlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  selectedPlaylist={selectedPlaylist}
                  expandedPlaylist={expandedPlaylist}
                  playlistTracks={playlistTracks}
                  loadingTracks={loadingTracks}
                  togglePlaylist={togglePlaylist}
                  setSelectedPlaylist={setSelectedPlaylist}
                  deletePlaylist={deletePlaylist}
                  deleteTrackFromPlaylist={deleteTrackFromPlaylist}
                  router={router}
                  editingPosition={editingPosition}
                  setEditingPosition={setEditingPosition}
                  tempPosition={tempPosition}
                  setTempPosition={setTempPosition}
                  handlePositionChange={handlePositionChange}
                  totalPlaylists={localPlaylists.length}
                />
              ))}
            </div>
          )}
        </div>

        {/* Search & Add Panel */}
        <div className="rounded-lg border border-white/10 bg-[#181818] p-6">
          <h2 className="text-xl font-bold mb-4">Search & Add Music</h2>
          {selectedPlaylist ? (
            <>
              <div className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <div className="text-sm text-white/60">Adding to:</div>
                <div className="font-semibold">{selectedPlaylist.title}</div>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchMusic(e.target.value);
                  }}
                  placeholder="Search for tracks..."
                  className="w-full bg-[#282828] border border-white/20 rounded-lg pl-10 pr-3 py-3 text-white placeholder:text-white/40"
                />
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {searchTracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 p-3 bg-[#282828] rounded-lg hover:bg-[#333] transition"
                  >
                    {track.imageUrl && (
                      <img
                        src={track.imageUrl}
                        alt={track.title}
                        className="w-12 h-12 rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{track.title}</div>
                      {track.artists && (
                        <div className="text-sm text-white/60 truncate">
                          {track.artists.map((a: any) => a.name).join(", ")}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => addTrackToPlaylist(track.id)}
                      className="px-3 py-1.5 bg-primary text-black text-sm font-semibold rounded hover:brightness-110 transition"
                    >
                      Add
                    </button>
                  </div>
                ))}
                {searchQuery && searchTracks.length === 0 && (
                  <div className="text-center py-8 text-white/40">
                    No tracks found
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-white/40">
              Select a playlist to start adding music
            </div>
          )}
        </div>
      </div>

      {/* Create Playlist Dialog */}
      {showCreatePlaylist && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#282828] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Create New Playlist</h3>
            <input
              type="text"
              value={newPlaylistTitle}
              onChange={(e) => setNewPlaylistTitle(e.target.value)}
              placeholder="Playlist title"
              className="w-full bg-[#181818] border border-white/20 rounded-lg px-3 py-3 text-white mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={createPlaylist}
                className="flex-1 bg-primary text-black font-semibold py-2 rounded-lg hover:brightness-110 transition"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreatePlaylist(false);
                  setNewPlaylistTitle("");
                }}
                className="flex-1 bg-white/10 text-white font-semibold py-2 rounded-lg hover:bg-white/20 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Playlist Card Component (without drag-and-drop)
function PlaylistCard(props: any) {
  const {
    playlist,
    selectedPlaylist,
    expandedPlaylist,
    playlistTracks,
    loadingTracks,
    togglePlaylist,
    setSelectedPlaylist,
    deletePlaylist,
    deleteTrackFromPlaylist,
    router,
    editingPosition,
    setEditingPosition,
    tempPosition,
    setTempPosition,
    handlePositionChange,
    totalPlaylists,
  } = props;

  return (
    <div className="rounded-lg bg-[#282828] overflow-hidden">
      <div
        className={`group flex items-center gap-2 p-3 transition ${
          selectedPlaylist?.id === playlist.id
            ? "bg-primary/20 border-l-4 border-primary"
            : "hover:bg-[#333]"
        }`}
      >
        {/* Position Number Input */}
        <div>
          {editingPosition === playlist.id ? (
            <input
              type="number"
              value={tempPosition}
              onChange={(e) => setTempPosition(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const pos = parseInt(tempPosition);
                  if (!isNaN(pos)) {
                    handlePositionChange(playlist.id, pos);
                  }
                } else if (e.key === "Escape") {
                  setEditingPosition(null);
                }
              }}
              onBlur={() => {
                const pos = parseInt(tempPosition);
                if (!isNaN(pos)) {
                  handlePositionChange(playlist.id, pos);
                } else {
                  setEditingPosition(null);
                }
              }}
              min={1}
              max={totalPlaylists}
              className="w-10 bg-[#181818] border border-primary rounded px-2 py-1 text-xs text-white text-center"
              autoFocus
            />
          ) : (
            <button
              onClick={() => {
                setEditingPosition(playlist.id);
                setTempPosition((playlist.position || 1).toString());
              }}
              className="w-10 h-7 bg-[#1a1a1a] hover:bg-[#222] border border-white/20 rounded px-2 py-1 text-xs text-white/60 hover:text-white transition text-center"
              title="Click to change position"
            >
              #{playlist.position || 1}
            </button>
          )}
        </div>

        <button
          onClick={() => togglePlaylist(playlist.id)}
          className="flex-1 text-left"
        >
          <div className="font-semibold">{playlist.title}</div>
          <div className="text-xs text-white/60 mt-1">
            {playlist.trackCount || 0} tracks
          </div>
        </button>
        <button
          onClick={() => router.push(`/playlists/${playlist.id}`)}
          className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded transition"
          title="Open playlist"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          onClick={() => setSelectedPlaylist(playlist)}
          className={`p-2 rounded transition ${
            selectedPlaylist?.id === playlist.id
              ? "bg-primary text-black"
              : "hover:bg-white/10"
          }`}
          title="Select for adding tracks"
        >
          <ListPlus className="h-4 w-4" />
        </button>
        <button
          onClick={() => deletePlaylist(playlist.id, playlist.title)}
          className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 text-red-500 rounded transition"
          title="Delete playlist"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      
      {/* Expanded tracks view */}
      {expandedPlaylist === playlist.id && (
        <div className="border-t border-white/10 bg-[#1a1a1a]">
          {loadingTracks === playlist.id ? (
            <div className="p-4 text-center text-white/40 text-sm">
              Loading tracks...
            </div>
          ) : playlistTracks[playlist.id]?.length > 0 ? (
            <div className="divide-y divide-white/5">
              {playlistTracks[playlist.id].map((item: any, index: number) => (
                <div
                  key={item.track.id}
                  className="flex items-center gap-3 p-3 hover:bg-white/5 transition group"
                >
                  <span className="text-xs text-white/40 w-6">{index + 1}</span>
                  {item.track.imageUrl && (
                    <img
                      src={item.track.imageUrl}
                      alt={item.track.title}
                      className="w-10 h-10 rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {item.track.title}
                    </div>
                    <div className="text-xs text-white/60 truncate">
                      {item.track.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist"}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      deleteTrackFromPlaylist(
                        playlist.id,
                        item.track.id,
                        item.track.title
                      )
                    }
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 text-red-500 rounded transition"
                    title="Remove from playlist"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-white/40 text-sm">
              No tracks in this playlist
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Artists Manager Tab Component
function ArtistsManagerTab() {
  const [artists, setArtists] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingArtist, setEditingArtist] = useState<number | null>(null);
  const [editData, setEditData] = useState({
    name: "",
    bio: "",
    imageUrl: "",
    bannerUrl: "",
    isVerified: false,
    monthlyListeners: 0,
  });

  useEffect(() => {
    loadArtists();
  }, []);

  const loadArtists = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("bearer_token");
      
      const res = await fetch("/api/artists?limit=50&sort=popularity", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error("Failed to load artists");

      const data = await res.json();
      setArtists(data);
    } catch (error) {
      toast.error("Failed to load artists");
    } finally {
      setLoading(false);
    }
  };

  const searchArtists = async (query: string) => {
    if (!query.trim()) {
      loadArtists();
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("bearer_token");
      
      const res = await fetch(`/api/artists?query=${encodeURIComponent(query)}&limit=50`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();
      setArtists(data);
    } catch (error) {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const deleteArtist = async (artistId: number, artistName: string) => {
    if (!confirm(`Delete artist "${artistName}"? This will permanently remove the artist profile. This cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("bearer_token");
      const adminEmail = localStorage.getItem("admin_email");

      const res = await fetch(`/api/artists/${artistId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-test-user-email": adminEmail || "",
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete artist");
      }

      toast.success("Artist deleted successfully");
      loadArtists();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete artist");
    }
  };

  const startEdit = (artist: any) => {
    setEditingArtist(artist.id);
    setEditData({
      name: artist.name,
      bio: artist.bio || "",
      imageUrl: artist.imageUrl || "",
      bannerUrl: artist.bannerUrl || "",
      isVerified: artist.isVerified || false,
      monthlyListeners: artist.monthlyListeners || 0,
    });
  };

  const saveEdit = async (artistId: number) => {
    try {
      const token = localStorage.getItem("bearer_token");

      const res = await fetch(`/api/artists/${artistId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });

      if (!res.ok) throw new Error("Failed to update artist");

      toast.success("Artist updated");
      setEditingArtist(null);
      loadArtists();
    } catch (error) {
      toast.error("Failed to update artist");
    }
  };

  const uploadImage = async (file: File, type: "image" | "banner") => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5MB or less");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await res.json();
      
      if (type === "image") {
        setEditData((prev) => ({ ...prev, imageUrl: data.url }));
      } else {
        setEditData((prev) => ({ ...prev, bannerUrl: data.url }));
      }
      
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image");
    }
  };

  if (loading && artists.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/60">Loading artists...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Artists Manager</h1>
        <p className="text-white/60 mt-1">
          Manage artist profiles, verification, and metadata
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            searchArtists(e.target.value);
          }}
          placeholder="Search artists..."
          className="w-full bg-[#181818] border border-white/20 rounded-lg pl-10 pr-3 py-3 text-white placeholder:text-white/40"
        />
      </div>

      <div className="rounded-lg border border-white/10 bg-[#181818] overflow-hidden">
        {artists.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            {searchQuery ? "No artists found" : "No artists available"}
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {artists.map((artist) => (
              <div
                key={artist.id}
                className="p-4 hover:bg-white/5 transition"
              >
                {editingArtist === artist.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Profile Image */}
                      <div className="space-y-2">
                        <label className="text-sm text-white/60">Profile Image</label>
                        {editData.imageUrl && (
                          <div className="relative w-32 h-32 rounded-full overflow-hidden">
                            <img
                              src={editData.imageUrl}
                              alt="Profile preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => setEditData({ ...editData, imageUrl: "" })}
                              className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-500 rounded-full"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        <label className="flex items-center justify-center gap-2 w-full bg-[#282828] border border-white/20 rounded px-3 py-2 text-sm text-white cursor-pointer hover:bg-[#333] transition">
                          <Upload className="h-4 w-4" />
                          {editData.imageUrl ? "Change Image" : "Upload Image"}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) uploadImage(file, "image");
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Banner Image */}
                      <div className="space-y-2">
                        <label className="text-sm text-white/60">Banner Image</label>
                        {editData.bannerUrl && (
                          <div className="relative w-full h-32 rounded overflow-hidden">
                            <img
                              src={editData.bannerUrl}
                              alt="Banner preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => setEditData({ ...editData, bannerUrl: "" })}
                              className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-500 rounded"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        <label className="flex items-center justify-center gap-2 w-full bg-[#282828] border border-white/20 rounded px-3 py-2 text-sm text-white cursor-pointer hover:bg-[#333] transition">
                          <Upload className="h-4 w-4" />
                          {editData.bannerUrl ? "Change Banner" : "Upload Banner"}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) uploadImage(file, "banner");
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-white/60">Artist Name</label>
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="w-full bg-[#282828] border border-white/20 rounded px-3 py-2 text-white"
                        placeholder="Artist name"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-white/60">Bio</label>
                      <textarea
                        value={editData.bio}
                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                        rows={4}
                        className="w-full bg-[#282828] border border-white/20 rounded px-3 py-2 text-white resize-none"
                        placeholder="Artist biography"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-white/60">Monthly Listeners</label>
                        <input
                          type="number"
                          value={editData.monthlyListeners}
                          onChange={(e) => setEditData({ ...editData, monthlyListeners: parseInt(e.target.value) || 0 })}
                          className="w-full bg-[#282828] border border-white/20 rounded px-3 py-2 text-white"
                          min="0"
                        />
                      </div>

                      <div className="flex items-end">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={editData.isVerified}
                            onChange={(e) => setEditData({ ...editData, isVerified: e.target.checked })}
                            className="rounded"
                          />
                          Verified Artist
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(artist.id)}
                        className="flex items-center gap-1 bg-primary text-black px-4 py-2 rounded text-sm font-semibold hover:brightness-110"
                      >
                        <Save className="h-4 w-4" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingArtist(null)}
                        className="flex items-center gap-1 bg-white/10 text-white px-4 py-2 rounded text-sm hover:bg-white/20"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    {artist.imageUrl ? (
                      <img
                        src={artist.imageUrl}
                        alt={artist.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold">
                        {artist.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{artist.name}</h3>
                        {artist.isVerified && (
                          <span className="inline-flex items-center gap-1 bg-blue-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <svg className="h-2.5 w-2.5 fill-white" viewBox="0 0 24 24">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                            VERIFIED
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/60 truncate">
                        {artist.slug} • {artist.monthlyListeners?.toLocaleString() || 0} monthly listeners
                      </p>
                      {artist.bio && (
                        <p className="text-sm text-white/60 line-clamp-2 mt-1">
                          {artist.bio}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(artist)}
                        className="p-2 hover:bg-white/10 rounded transition"
                        title="Edit artist"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteArtist(artist.id, artist.name)}
                        className="p-2 hover:bg-red-500/20 text-red-500 rounded transition"
                        title="Delete artist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}