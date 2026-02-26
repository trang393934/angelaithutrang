import { useState, useEffect, DragEvent, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  ArrowLeft, Upload, FileText, Trash2, 
  LogOut, Sparkles, CheckCircle, Clock,
  FileType, AlertCircle, FolderPlus, Folder,
  Edit2, X, ChevronDown, ChevronRight, GripVertical,
  Search, Filter, XCircle, Link as LinkIcon, ExternalLink, Eye,
  History, RefreshCw, BookOpen, Download, FolderInput
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import angelAvatar from "@/assets/angel-avatar.png";
import { 
  PPLP_KNOWLEDGE_TEMPLATES, 
  PPLP_FOLDER_NAME, 
  getPPLPDocumentTitle,
  type PPLPKnowledgeTemplate 
} from "@/data/pplpKnowledgeTemplates";

interface KnowledgeFolder {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface KnowledgeDocument {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size: number;
  is_processed: boolean;
  created_at: string;
  folder_id: string | null;
  extracted_content: string | null;
}

type ProcessedFilter = "all" | "processed" | "pending";

const AdminKnowledge = () => {
  const { user, isAdmin, isLoading: authLoading, isAdminChecked, signOut } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [folders, setFolders] = useState<KnowledgeFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  
  // Helper: load from sessionStorage with fallback
  const loadSession = <T,>(key: string, fallback: T): T => {
    try {
      const raw = sessionStorage.getItem(`admin_knowledge_${key}`);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  };
  const saveSession = <T,>(key: string, value: T) => {
    try { sessionStorage.setItem(`admin_knowledge_${key}`, JSON.stringify(value)); } catch {}
  };

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState<string>(() => loadSession("searchQuery", ""));
  const [filterFolder, setFilterFolder] = useState<string | null | "all" | "uncategorized">(() => loadSession("filterFolder", "all"));
  const [filterProcessed, setFilterProcessed] = useState<ProcessedFilter>(() => loadSession("filterProcessed", "all" as ProcessedFilter));
  
  // Drag and drop state
  const [draggedDoc, setDraggedDoc] = useState<KnowledgeDocument | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null | "uncategorized">(null);
  
  // Folder form
  const [showFolderForm, setShowFolderForm] = useState<boolean>(() => loadSession("showFolderForm", false));
  const [editingFolder, setEditingFolder] = useState<KnowledgeFolder | null>(null);
  const [folderForm, setFolderForm] = useState<{ name: string; description: string }>(() => loadSession("folderForm", { name: "", description: "" }));
  
  // Upload form
  const [uploadForm, setUploadForm] = useState<{ title: string; description: string; file: File | null; folderId: string | null }>(() => ({
    ...loadSession("uploadForm", { title: "", description: "", folderId: null }),
    file: null, // File objects cannot be serialized
  }));

  // Google URL import
  const [googleUrlForm, setGoogleUrlForm] = useState<{ url: string; title: string; description: string; folderId: string | null }>(() => loadSession("googleUrlForm", {
    url: "",
    title: "",
    description: "",
    folderId: null,
  }));
  const [isFetchingGoogle, setIsFetchingGoogle] = useState(false);
  const [googlePreview, setGooglePreview] = useState<{ content: string; sourceType: string } | null>(null);
  const [syncingDocId, setSyncingDocId] = useState<string | null>(null);

  // PPLP Documents state
  const [importedPPLPDocs, setImportedPPLPDocs] = useState<Set<string>>(new Set());
  const [importingPPLP, setImportingPPLP] = useState<string | null>(null);
  const [importingAllPPLP, setImportingAllPPLP] = useState(false);

  // Filtered documents based on search and filters
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      // Search filter
      const matchesSearch = searchQuery === "" || 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        doc.file_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Folder filter
      const matchesFolder = filterFolder === "all" || 
        (filterFolder === "uncategorized" && doc.folder_id === null) ||
        doc.folder_id === filterFolder;
      
      // Processed filter
      const matchesProcessed = filterProcessed === "all" ||
        (filterProcessed === "processed" && doc.is_processed) ||
        (filterProcessed === "pending" && !doc.is_processed);
      
      return matchesSearch && matchesFolder && matchesProcessed;
    });
  }, [documents, searchQuery, filterFolder, filterProcessed]);

  const hasActiveFilters = searchQuery !== "" || filterFolder !== "all" || filterProcessed !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setFilterFolder("all");
    setFilterProcessed("all");
  };

  // Persist form states to sessionStorage whenever they change
  useEffect(() => { saveSession("searchQuery", searchQuery); }, [searchQuery]);
  useEffect(() => { saveSession("filterFolder", filterFolder); }, [filterFolder]);
  useEffect(() => { saveSession("filterProcessed", filterProcessed); }, [filterProcessed]);
  useEffect(() => { saveSession("showFolderForm", showFolderForm); }, [showFolderForm]);
  useEffect(() => { saveSession("folderForm", folderForm); }, [folderForm]);
  useEffect(() => {
    saveSession("uploadForm", { title: uploadForm.title, description: uploadForm.description, folderId: uploadForm.folderId });
  }, [uploadForm.title, uploadForm.description, uploadForm.folderId]);
  useEffect(() => { saveSession("googleUrlForm", googleUrlForm); }, [googleUrlForm]);

  // Save & restore scroll position
  useEffect(() => {
    const savedScroll = loadSession<number>("scrollY", 0);
    if (savedScroll) {
      requestAnimationFrame(() => window.scrollTo({ top: savedScroll, behavior: "instant" as ScrollBehavior }));
    }
    const handleScroll = () => saveSession("scrollY", window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!authLoading && isAdminChecked) {
      if (!user) {
        navigate("/admin/login");
      } else if (!isAdmin) {
        toast.error("Bạn không có quyền truy cập trang này");
        navigate("/");
      } else {
        fetchData();
      }
    }
  }, [user, isAdmin, authLoading, isAdminChecked, navigate]);

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchFolders(), fetchDocuments(), fetchImportedPPLPDocs()]);
    setIsLoading(false);
  };

  const fetchFolders = async () => {
    const { data, error } = await supabase
      .from("knowledge_folders")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching folders:", error);
    } else {
      setFolders(data || []);
      // Expand all folders by default
      setExpandedFolders(new Set((data || []).map(f => f.id)));
    }
  };

  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from("knowledge_documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error);
      toast.error("Không thể tải danh sách tài liệu");
    } else {
      setDocuments(data || []);
    }
  };

  // Fetch imported PPLP documents
  const fetchImportedPPLPDocs = async () => {
    const { data, error } = await supabase
      .from("knowledge_documents")
      .select("title")
      .like("title", "[PPLP]%");

    if (!error && data) {
      const importedIds = new Set<string>();
      PPLP_KNOWLEDGE_TEMPLATES.forEach(template => {
        const expectedTitle = getPPLPDocumentTitle(template.title);
        if (data.some(doc => doc.title === expectedTitle)) {
          importedIds.add(template.id);
        }
      });
      setImportedPPLPDocs(importedIds);
    }
  };

  // Get or create PPLP folder
  const getOrCreatePPLPFolder = async (): Promise<string | null> => {
    // Check if folder exists
    const { data: existingFolder } = await supabase
      .from("knowledge_folders")
      .select("id")
      .eq("name", PPLP_FOLDER_NAME)
      .single();

    if (existingFolder) {
      return existingFolder.id;
    }

    // Create folder
    const { data: newFolder, error } = await supabase
      .from("knowledge_folders")
      .insert({
        name: PPLP_FOLDER_NAME,
        description: "Tài liệu về giao thức PPLP - Proof of Pure Love",
        created_by: user?.id
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating PPLP folder:", error);
      return null;
    }

    await fetchFolders();
    return newFolder?.id || null;
  };

  // Import single PPLP template
  const handleImportPPLPTemplate = async (template: PPLPKnowledgeTemplate) => {
    if (importedPPLPDocs.has(template.id)) {
      toast.info("Tài liệu này đã được import");
      return;
    }

    setImportingPPLP(template.id);

    try {
      const folderId = await getOrCreatePPLPFolder();
      const title = getPPLPDocumentTitle(template.title);

      const { error } = await supabase
        .from("knowledge_documents")
        .insert({
          title,
          description: template.description,
          file_name: `pplp-${template.id}.txt`,
          file_url: "",
          file_type: "text/plain",
          file_size: new Blob([template.content]).size,
          extracted_content: template.content,
          is_processed: true,
          created_by: user?.id,
          folder_id: folderId
        });

      if (error) throw error;

      setImportedPPLPDocs(prev => new Set([...prev, template.id]));
      toast.success(`Đã import "${template.title}" ✨`);
      await fetchDocuments();
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Không thể import tài liệu");
    } finally {
      setImportingPPLP(null);
    }
  };

  // Import all PPLP templates
  const handleImportAllPPLP = async () => {
    const notImported = PPLP_KNOWLEDGE_TEMPLATES.filter(t => !importedPPLPDocs.has(t.id));
    
    if (notImported.length === 0) {
      toast.info("Tất cả tài liệu PPLP đã được import");
      return;
    }

    setImportingAllPPLP(true);

    try {
      const folderId = await getOrCreatePPLPFolder();
      
      for (const template of notImported) {
        const title = getPPLPDocumentTitle(template.title);
        
        await supabase
          .from("knowledge_documents")
          .insert({
            title,
            description: template.description,
            file_name: `pplp-${template.id}.txt`,
            file_url: "",
            file_type: "text/plain",
            file_size: new Blob([template.content]).size,
            extracted_content: template.content,
            is_processed: true,
            created_by: user?.id,
            folder_id: folderId
          });
      }

      setImportedPPLPDocs(new Set(PPLP_KNOWLEDGE_TEMPLATES.map(t => t.id)));
      toast.success(`Đã import ${notImported.length} tài liệu PPLP! ✨`);
      await fetchDocuments();
    } catch (error) {
      console.error("Import all error:", error);
      toast.error("Có lỗi khi import tài liệu");
    } finally {
      setImportingAllPPLP(false);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: DragEvent<HTMLDivElement>, doc: KnowledgeDocument) => {
    setDraggedDoc(doc);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", doc.id);
  };

  const handleDragEnd = () => {
    setDraggedDoc(null);
    setDragOverFolderId(null);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, folderId: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverFolderId(folderId === null ? "uncategorized" : folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, targetFolderId: string | null) => {
    e.preventDefault();
    setDragOverFolderId(null);
    
    if (!draggedDoc) return;
    
    // Don't do anything if dropping on same folder
    if (draggedDoc.folder_id === targetFolderId) {
      setDraggedDoc(null);
      return;
    }

    try {
      const { error } = await supabase
        .from("knowledge_documents")
        .update({ folder_id: targetFolderId })
        .eq("id", draggedDoc.id);

      if (error) throw error;

      // Update local state immediately for smooth UX
      setDocuments(prev => 
        prev.map(d => 
          d.id === draggedDoc.id 
            ? { ...d, folder_id: targetFolderId } 
            : d
        )
      );

      const folderName = targetFolderId 
        ? folders.find(f => f.id === targetFolderId)?.name 
        : "Chưa phân loại";
      toast.success(`Đã chuyển "${draggedDoc.title}" sang "${folderName}"`);
    } catch (error) {
      console.error("Move error:", error);
      toast.error("Không thể di chuyển tài liệu");
    }

    setDraggedDoc(null);
  };

  // Move document to folder via button
  const handleMoveToFolder = async (doc: KnowledgeDocument, targetFolderId: string | null) => {
    if (doc.folder_id === targetFolderId) return;

    try {
      const { error } = await supabase
        .from("knowledge_documents")
        .update({ folder_id: targetFolderId })
        .eq("id", doc.id);

      if (error) throw error;

      // Update local state immediately for smooth UX
      setDocuments(prev => 
        prev.map(d => 
          d.id === doc.id 
            ? { ...d, folder_id: targetFolderId } 
            : d
        )
      );

      const folderName = targetFolderId 
        ? folders.find(f => f.id === targetFolderId)?.name 
        : "Chưa phân loại";
      toast.success(`Đã chuyển "${doc.title}" sang "${folderName}"`);
    } catch (error) {
      console.error("Move error:", error);
      toast.error("Không thể di chuyển tài liệu");
    }
  };
  // Folder CRUD
  const handleSaveFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderForm.name.trim()) {
      toast.error("Vui lòng nhập tên thư mục");
      return;
    }

    try {
      if (editingFolder) {
        const { error } = await supabase
          .from("knowledge_folders")
          .update({ name: folderForm.name, description: folderForm.description || null })
          .eq("id", editingFolder.id);
        if (error) throw error;
        toast.success("Đã cập nhật thư mục");
      } else {
        const { error } = await supabase
          .from("knowledge_folders")
          .insert({ 
            name: folderForm.name, 
            description: folderForm.description || null,
            created_by: user?.id 
          });
        if (error) throw error;
        toast.success("Đã tạo thư mục mới");
      }
      
      setFolderForm({ name: "", description: "" });
      setShowFolderForm(false);
      setEditingFolder(null);
      fetchFolders();
    } catch (error) {
      console.error("Folder save error:", error);
      toast.error("Không thể lưu thư mục");
    }
  };

  const handleEditFolder = (folder: KnowledgeFolder) => {
    setEditingFolder(folder);
    setFolderForm({ name: folder.name, description: folder.description || "" });
    setShowFolderForm(true);
  };

  const handleDeleteFolder = async (folder: KnowledgeFolder) => {
    const docsInFolder = documents.filter(d => d.folder_id === folder.id);
    if (docsInFolder.length > 0) {
      if (!confirm(`Thư mục "${folder.name}" chứa ${docsInFolder.length} tài liệu. Các tài liệu sẽ được chuyển về "Chưa phân loại". Tiếp tục?`)) {
        return;
      }
    } else if (!confirm(`Bạn có chắc muốn xóa thư mục "${folder.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("knowledge_folders")
        .delete()
        .eq("id", folder.id);
      if (error) throw error;
      toast.success("Đã xóa thư mục");
      fetchData();
    } catch (error) {
      console.error("Folder delete error:", error);
      toast.error("Không thể xóa thư mục");
    }
  };

  // File handling - removed size limit
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm(prev => ({ 
        ...prev, 
        file,
        title: prev.title || file.name.replace(/\.[^/.]+$/, "")
      }));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.title) {
      toast.error("Vui lòng chọn file và nhập tiêu đề");
      return;
    }

    setIsUploading(true);

    try {
      // Upload file to storage
      const fileExt = uploadForm.file.name.split(".").pop()?.toLowerCase();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("knowledge-documents")
        .upload(fileName, uploadForm.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("knowledge-documents")
        .getPublicUrl(fileName);

      // Extract text content based on file type
      let extractedContent = null;
      const file = uploadForm.file;
      const fileType = file.type || "";
      const name = file.name.toLowerCase();

      // TXT and MD files
      if (fileType === "text/plain" || fileType === "text/markdown" || 
          name.endsWith(".txt") || name.endsWith(".md")) {
        extractedContent = await file.text();
      }
      // CSV files
      else if (fileType === "text/csv" || name.endsWith(".csv")) {
        const text = await file.text();
        extractedContent = formatCSVToReadable(text);
      }
      // Excel files
      else if (fileType === "application/vnd.ms-excel" || 
               fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
               name.endsWith(".xlsx") || name.endsWith(".xls")) {
        const buffer = await file.arrayBuffer();
        extractedContent = await extractExcelContent(buffer);
      }

      // Save document metadata to database
      const { error: dbError } = await supabase
        .from("knowledge_documents")
        .insert({
          title: uploadForm.title,
          description: uploadForm.description || null,
          file_name: uploadForm.file.name,
          file_url: urlData.publicUrl,
          file_type: uploadForm.file.type || "application/octet-stream",
          file_size: uploadForm.file.size,
          extracted_content: extractedContent,
          is_processed: !!extractedContent,
          created_by: user?.id,
          folder_id: uploadForm.folderId,
        });

      if (dbError) throw dbError;

      toast.success("Upload tài liệu thành công! ✨");
      setUploadForm({ title: "", description: "", file: null, folderId: selectedFolderId });
      saveSession("uploadForm", { title: "", description: "", folderId: selectedFolderId });
      fetchDocuments();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Không thể upload tài liệu. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  // Helper function to format CSV content
  const formatCSVToReadable = (csvText: string): string => {
    const lines = csvText.split('\n');
    if (lines.length === 0) return csvText;

    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]);
    const rows = lines.slice(1).filter(line => line.trim()).map(parseCSVLine);

    let formatted = `📊 BẢNG DỮ LIỆU (${rows.length} dòng)\n`;
    formatted += `${'─'.repeat(50)}\n`;
    formatted += `Các cột: ${headers.join(' | ')}\n`;
    formatted += `${'─'.repeat(50)}\n\n`;

    rows.forEach((row, index) => {
      formatted += `--- Dòng ${index + 1} ---\n`;
      headers.forEach((header, i) => {
        const value = row[i] || '';
        if (value) {
          formatted += `${header}: ${value}\n`;
        }
      });
      formatted += '\n';
    });

    return formatted;
  };

  // Helper function to extract Excel content (dynamic import to avoid React conflict)
  const extractExcelContent = async (buffer: ArrayBuffer): Promise<string> => {
    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      let content = '';

      workbook.worksheets.forEach((worksheet, sheetIndex) => {
        const sheetName = worksheet.name;
        const rowCount = worksheet.rowCount;
        if (rowCount === 0) return;

        content += `\n📋 SHEET ${sheetIndex + 1}: ${sheetName}\n`;
        content += `${'═'.repeat(50)}\n`;

        const headerRow = worksheet.getRow(1);
        const headers: string[] = [];
        headerRow.eachCell((cell, colNumber) => {
          headers[colNumber - 1] = String(cell.value ?? `Cột ${colNumber}`);
        });

        content += `Các cột: ${headers.join(' | ')}\n`;
        content += `${'─'.repeat(50)}\n\n`;

        for (let rowNum = 2; rowNum <= rowCount; rowNum++) {
          const row = worksheet.getRow(rowNum);
          const hasData = row.values && (row.values as unknown[]).some(v => v !== undefined && v !== null && v !== '');
          if (!hasData) continue;

          content += `--- Dòng ${rowNum - 1} ---\n`;
          headers.forEach((header, i) => {
            const cell = row.getCell(i + 1);
            const value = cell.value;
            if (value !== undefined && value !== null && value !== '') {
              content += `${header}: ${value}\n`;
            }
          });
          content += '\n';
        }
      });

      return content || 'Không thể trích xuất nội dung từ file Excel';
    } catch (error) {
      console.error('Excel parse error:', error);
      return 'Lỗi khi đọc file Excel';
    }
  };

  // Handle Google URL fetch
  const handleFetchGoogleUrl = async () => {
    if (!googleUrlForm.url) {
      toast.error("Vui lòng nhập URL Google Docs hoặc Google Sheets");
      return;
    }

    setIsFetchingGoogle(true);
    setGooglePreview(null);

    try {
      const response = await supabase.functions.invoke('fetch-google-content', {
        body: { url: googleUrlForm.url }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch content');
      }

      const data = response.data;
      
      if (data.error) {
        toast.error(data.error);
        if (data.hint) {
          toast.info(data.hint, { duration: 5000 });
        }
        return;
      }

      setGooglePreview({
        content: data.content,
        sourceType: data.sourceType
      });

      // Auto-fill title if empty
      if (!googleUrlForm.title) {
        const urlType = data.sourceType === 'google_docs' ? 'Google Doc' : 'Google Sheet';
        setGoogleUrlForm(prev => ({
          ...prev,
          title: `${urlType} - ${new Date().toLocaleDateString('vi-VN')}`
        }));
      }

      toast.success("Đã lấy nội dung thành công! Xem preview bên dưới.");
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error(error instanceof Error ? error.message : 'Không thể lấy nội dung từ URL');
    } finally {
      setIsFetchingGoogle(false);
    }
  };

  // Handle save Google content
  const handleSaveGoogleContent = async () => {
    if (!googlePreview || !googleUrlForm.title) {
      toast.error("Vui lòng nhập tiêu đề và lấy nội dung trước");
      return;
    }

    setIsUploading(true);

    try {
      const fileName = `${googlePreview.sourceType === 'google_docs' ? 'google-doc' : 'google-sheet'}-${Date.now()}.txt`;
      
      const { error: dbError } = await supabase
        .from("knowledge_documents")
        .insert({
          title: googleUrlForm.title,
          description: googleUrlForm.description || `Imported from ${googlePreview.sourceType === 'google_docs' ? 'Google Docs' : 'Google Sheets'}`,
          file_name: fileName,
          file_url: googleUrlForm.url,
          file_type: 'text/plain',
          file_size: new Blob([googlePreview.content]).size,
          extracted_content: googlePreview.content,
          is_processed: true,
          created_by: user?.id,
          folder_id: googleUrlForm.folderId,
        });

      if (dbError) throw dbError;

      toast.success("Đã lưu tài liệu thành công! ✨");
      setGoogleUrlForm({ url: "", title: "", description: "", folderId: selectedFolderId });
      saveSession("googleUrlForm", { url: "", title: "", description: "", folderId: selectedFolderId });
      setGooglePreview(null);
      fetchDocuments();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Không thể lưu tài liệu. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (doc: KnowledgeDocument) => {
    if (!confirm(`Bạn có chắc muốn xóa tài liệu "${doc.title}"?`)) return;

    try {
      // Delete from storage (try to find the actual stored filename)
      const { data: files } = await supabase.storage
        .from("knowledge-documents")
        .list();
      
      const matchingFile = files?.find(f => f.name.includes(doc.file_name.split('.')[0]) || doc.file_name.includes(f.name));
      
      if (matchingFile) {
        await supabase.storage
          .from("knowledge-documents")
          .remove([matchingFile.name]);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from("knowledge_documents")
        .delete()
        .eq("id", doc.id);

      if (dbError) throw dbError;

      toast.success("Đã xóa tài liệu");
      fetchDocuments();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Không thể xóa tài liệu");
    }
  };

  // Handle sync Google document
  const handleSyncDocument = async (doc: KnowledgeDocument) => {
    // Check if this is a Google URL
    const isGoogleUrl = doc.file_url.includes('docs.google.com/document') || 
                        doc.file_url.includes('docs.google.com/spreadsheets');
    
    if (!isGoogleUrl) {
      toast.error("Chỉ có thể đồng bộ tài liệu từ Google Docs/Sheets");
      return;
    }

    setSyncingDocId(doc.id);

    try {
      const response = await supabase.functions.invoke('fetch-google-content', {
        body: { url: doc.file_url }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch content');
      }

      const data = response.data;
      
      if (data.error) {
        toast.error(data.error);
        if (data.hint) {
          toast.info(data.hint, { duration: 5000 });
        }
        return;
      }

      // Update the document with new content
      const { error: updateError } = await supabase
        .from("knowledge_documents")
        .update({
          extracted_content: data.content,
          file_size: new Blob([data.content]).size,
          is_processed: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", doc.id);

      if (updateError) throw updateError;

      toast.success(`Đã đồng bộ "${doc.title}" thành công! ✨`);
      fetchDocuments();
    } catch (error) {
      console.error("Sync error:", error);
      toast.error(error instanceof Error ? error.message : 'Không thể đồng bộ tài liệu');
    } finally {
      setSyncingDocId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  const getFileIcon = (type: string, fileName: string) => {
    if (type.includes("pdf") || fileName.endsWith(".pdf")) return "📄";
    if (type.includes("word") || type.includes("document") || fileName.endsWith(".docx") || fileName.endsWith(".doc")) return "📝";
    if (type.includes("text") || type.includes("markdown") || fileName.endsWith(".txt") || fileName.endsWith(".md")) return "📃";
    if (type.includes("image") || fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return "🖼️";
    if (type.includes("audio") || fileName.match(/\.(mp3|wav|ogg|m4a)$/i)) return "🎵";
    if (type.includes("video") || fileName.match(/\.(mp4|webm|avi|mov)$/i)) return "🎬";
    if (type.includes("spreadsheet") || fileName.match(/\.(xlsx|xls|csv)$/i)) return "📊";
    return "📁";
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const getDocumentsInFolder = (folderId: string | null) => {
    return documents.filter(d => d.folder_id === folderId);
  };

  const uncategorizedDocs = getDocumentsInFolder(null);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-pale via-background to-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-foreground-muted">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-pale via-background to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-pure/90 backdrop-blur-lg border-b border-primary-pale shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="p-2 rounded-full hover:bg-primary-pale transition-colors">
                <ArrowLeft className="w-5 h-5 text-primary" />
              </Link>
              <div className="flex items-center gap-3">
                <img src={angelAvatar} alt="Angel AI" className="w-10 h-10 rounded-full shadow-soft" />
                <div>
                  <h1 className="font-serif text-lg font-semibold text-primary-deep">Quản Lý Kiến Thức</h1>
                  <p className="text-xs text-foreground-muted">Huấn luyện Angel AI</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/admin/activity-history"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm text-foreground-muted hover:text-primary hover:bg-primary-pale transition-colors"
              >
                <History className="w-4 h-4" />
                Lịch sử chat
              </Link>
              <button
                onClick={() => signOut().then(() => navigate("/"))}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-foreground-muted hover:text-primary hover:bg-primary-pale transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Folder Management */}
        <div className="bg-white rounded-2xl shadow-soft border border-primary-pale/50 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-semibold text-primary-deep flex items-center gap-2">
              <Folder className="w-5 h-5" />
              Thư Mục Kiến Thức
            </h2>
            <button
              onClick={() => {
                setEditingFolder(null);
                setFolderForm({ name: "", description: "" });
                setShowFolderForm(!showFolderForm);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-pale text-primary hover:bg-primary hover:text-white transition-colors"
            >
              {showFolderForm ? <X className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
              <span className="hidden sm:inline">{showFolderForm ? "Hủy" : "Tạo Thư Mục"}</span>
            </button>
          </div>

          {/* Folder Form */}
          {showFolderForm && (
            <form onSubmit={handleSaveFolder} className="bg-primary-pale/30 rounded-xl p-4 mb-4">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-1">
                    Tên thư mục *
                  </label>
                  <input
                    type="text"
                    value={folderForm.name}
                    onChange={(e) => setFolderForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="VD: Giáo lý cơ bản"
                    className="w-full px-4 py-2.5 rounded-xl border border-primary-pale bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-1">
                    Mô tả
                  </label>
                  <input
                    type="text"
                    value={folderForm.description}
                    onChange={(e) => setFolderForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Mô tả ngắn về chủ đề"
                    className="w-full px-4 py-2.5 rounded-xl border border-primary-pale bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-sapphire-gradient text-white font-medium shadow-sacred hover:shadow-divine transition-all"
              >
                {editingFolder ? "Cập nhật" : "Tạo thư mục"}
              </button>
            </form>
          )}

          {/* Folders List */}
          {folders.length === 0 ? (
            <p className="text-center text-foreground-muted py-4">
              Chưa có thư mục nào. Tạo thư mục để tổ chức tài liệu theo chủ đề.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className={`group flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors cursor-pointer ${
                    selectedFolderId === folder.id 
                      ? "bg-primary text-white border-primary" 
                      : "bg-primary-pale/30 border-primary-pale hover:border-primary"
                  }`}
                  onClick={() => setSelectedFolderId(selectedFolderId === folder.id ? null : folder.id)}
                >
                  <Folder className="w-4 h-4" />
                  <span className="font-medium">{folder.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    selectedFolderId === folder.id ? "bg-white/20" : "bg-primary-pale"
                  }`}>
                    {getDocumentsInFolder(folder.id).length}
                  </span>
                  <div className="hidden group-hover:flex items-center gap-1 ml-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditFolder(folder); }}
                      className={`p-1 rounded hover:bg-white/20 ${selectedFolderId === folder.id ? "text-white" : "text-primary"}`}
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder); }}
                      className={`p-1 rounded hover:bg-red-100 ${selectedFolderId === folder.id ? "text-white hover:text-red-500" : "text-red-500"}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-2xl shadow-soft border border-primary-pale/50 p-6 mb-6">
          <h2 className="font-serif text-xl font-semibold text-primary-deep mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Tài Liệu Mới
            {selectedFolderId && (
              <span className="text-sm font-normal text-foreground-muted">
                → {folders.find(f => f.id === selectedFolderId)?.name}
              </span>
            )}
          </h2>
          
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-1">
                  Tiêu đề *
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Nhập tiêu đề tài liệu"
                  className="w-full px-4 py-2.5 rounded-xl border border-primary-pale bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  disabled={isUploading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-1">
                  Thư mục
                </label>
                <select
                  value={uploadForm.folderId || ""}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, folderId: e.target.value || null }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-primary-pale bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  disabled={isUploading}
                >
                  <option value="">-- Chưa phân loại --</option>
                  {folders.map(folder => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-muted mb-1">
                Mô tả
              </label>
              <input
                type="text"
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả ngắn về nội dung"
                className="w-full px-4 py-2.5 rounded-xl border border-primary-pale bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                disabled={isUploading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-muted mb-1">
                File tài liệu * (Không giới hạn định dạng và dung lượng)
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-primary-pale bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-primary-pale file:text-primary file:font-medium file:cursor-pointer"
                  disabled={isUploading}
                />
              </div>
              {uploadForm.file && (
                <p className="mt-2 text-sm text-foreground-muted flex items-center gap-2">
                  <FileType className="w-4 h-4" />
                  {uploadForm.file.name} ({formatFileSize(uploadForm.file.size)})
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isUploading || !uploadForm.file || !uploadForm.title}
              className="w-full py-3 rounded-xl bg-sapphire-gradient text-white font-medium shadow-sacred hover:shadow-divine disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <span>Đang upload...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Upload Tài Liệu</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Google URL Import */}
        <div className="bg-white rounded-2xl shadow-soft border border-primary-pale/50 p-6 mb-6">
          <h2 className="font-serif text-xl font-semibold text-primary-deep mb-4 flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            Import từ Google Drive
            <span className="text-xs font-normal bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Mới</span>
          </h2>

          <div className="bg-primary-pale/20 rounded-xl p-4 mb-4">
            <p className="text-sm text-foreground-muted flex items-start gap-2">
              <ExternalLink className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Hỗ trợ <strong>Google Docs</strong> và <strong>Google Sheets</strong>. 
                File phải được chia sẻ công khai (Anyone with the link can view).
              </span>
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground-muted mb-1">
                URL Google Docs/Sheets *
              </label>
              <input
                type="url"
                value={googleUrlForm.url}
                onChange={(e) => {
                  setGoogleUrlForm(prev => ({ ...prev, url: e.target.value }));
                  setGooglePreview(null);
                }}
                placeholder="https://docs.google.com/document/d/... hoặc https://docs.google.com/spreadsheets/d/..."
                className="w-full px-4 py-2.5 rounded-xl border border-primary-pale bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                disabled={isFetchingGoogle || isUploading}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-1">
                  Tiêu đề *
                </label>
                <input
                  type="text"
                  value={googleUrlForm.title}
                  onChange={(e) => setGoogleUrlForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Nhập tiêu đề tài liệu"
                  className="w-full px-4 py-2.5 rounded-xl border border-primary-pale bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  disabled={isFetchingGoogle || isUploading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-1">
                  Thư mục
                </label>
                <select
                  value={googleUrlForm.folderId || ""}
                  onChange={(e) => setGoogleUrlForm(prev => ({ ...prev, folderId: e.target.value || null }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-primary-pale bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  disabled={isFetchingGoogle || isUploading}
                >
                  <option value="">-- Chưa phân loại --</option>
                  {folders.map(folder => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-muted mb-1">
                Mô tả
              </label>
              <input
                type="text"
                value={googleUrlForm.description}
                onChange={(e) => setGoogleUrlForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả ngắn về nội dung"
                className="w-full px-4 py-2.5 rounded-xl border border-primary-pale bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                disabled={isFetchingGoogle || isUploading}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleFetchGoogleUrl}
                disabled={isFetchingGoogle || !googleUrlForm.url || isUploading}
                className="flex-1 py-3 rounded-xl bg-primary-pale text-primary font-medium hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
              >
                {isFetchingGoogle ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <span>Đang lấy dữ liệu...</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-5 h-5" />
                    <span>Lấy & Xem Trước</span>
                  </>
                )}
              </button>
              
              {googlePreview && (
                <button
                  type="button"
                  onClick={handleSaveGoogleContent}
                  disabled={isUploading || !googleUrlForm.title}
                  className="flex-1 py-3 rounded-xl bg-sapphire-gradient text-white font-medium shadow-sacred hover:shadow-divine disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Sparkles className="w-5 h-5 animate-pulse" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Lưu Tài Liệu</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Preview */}
            {googlePreview && (
              <div className="mt-4 border border-primary-pale rounded-xl overflow-hidden">
                <div className="bg-primary-pale/30 px-4 py-2 flex items-center justify-between">
                  <span className="font-medium text-primary-deep flex items-center gap-2">
                    {googlePreview.sourceType === 'google_docs' ? '📄 Google Docs' : '📊 Google Sheets'}
                    <span className="text-xs text-foreground-muted">
                      ({new Blob([googlePreview.content]).size.toLocaleString()} bytes)
                    </span>
                  </span>
                  <button
                    onClick={() => setGooglePreview(null)}
                    className="p-1 rounded hover:bg-white/50 transition-colors"
                  >
                    <X className="w-4 h-4 text-foreground-muted" />
                  </button>
                </div>
                <div className="p-4 max-h-64 overflow-auto bg-gray-50">
                  <pre className="text-xs text-foreground-muted whitespace-pre-wrap font-mono">
                    {googlePreview.content.slice(0, 2000)}
                    {googlePreview.content.length > 2000 && (
                      <span className="text-primary">... (còn {(googlePreview.content.length - 2000).toLocaleString()} ký tự)</span>
                    )}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PPLP Documents Section */}
        <div className="bg-white rounded-2xl shadow-soft border border-primary-pale/50 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-xl font-semibold text-primary-deep flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Tài liệu PPLP - Hướng dẫn Mint FUN Money
                <span className="text-xs font-normal bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  {documents.filter(d => d.title.startsWith('[PPLP]') || d.folder_id === folders.find(f => f.name === PPLP_FOLDER_NAME)?.id).length} tài liệu
                </span>
              </h2>
              <p className="text-sm text-foreground-muted mt-1">
                Các tài liệu giúp Angel AI trả lời về quy trình mint FUN Money theo PPLP
              </p>
            </div>
            {importedPPLPDocs.size < PPLP_KNOWLEDGE_TEMPLATES.length && (
              <button
                onClick={handleImportAllPPLP}
                disabled={importingAllPPLP}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sapphire-gradient text-white font-medium shadow-sacred hover:shadow-divine disabled:opacity-50 transition-all"
              >
                {importingAllPPLP ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    Đang import...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Import mẫu PPLP
                  </>
                )}
              </button>
            )}
          </div>

          {/* Show ALL PPLP Documents (imported from any source) */}
          <div className="space-y-3 mb-6">
            {documents
              .filter(doc => doc.title.startsWith('[PPLP]') || doc.folder_id === folders.find(f => f.name === PPLP_FOLDER_NAME)?.id)
              .map((doc) => {
                const isGoogleUrl = doc.file_url?.includes('docs.google.com');
                
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 rounded-xl border bg-green-50 border-green-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl flex-shrink-0">{getFileIcon(doc.file_type, doc.file_name)}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-foreground">{doc.title}</h3>
                          {isGoogleUrl && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full flex-shrink-0">
                              Google Docs
                            </span>
                          )}
                          {doc.is_processed && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full flex-shrink-0">
                              ✓ Đã xử lý
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground-muted truncate">{doc.description}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-foreground-muted">
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>•</span>
                          <span>{new Date(doc.created_at).toLocaleDateString("vi-VN")}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* View Full Button */}
                      <button
                        onClick={() => {
                          const content = doc.extracted_content;
                          if (content) {
                            const newWindow = window.open('', '_blank');
                            if (newWindow) {
                              newWindow.document.write(`
                                <html>
                                  <head>
                                    <title>${doc.title}</title>
                                    <style>
                                      body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 900px; margin: 0 auto; line-height: 1.6; }
                                      pre { white-space: pre-wrap; word-wrap: break-word; background: #f5f5f5; padding: 1rem; border-radius: 8px; }
                                      h1 { color: #4f46e5; }
                                    </style>
                                  </head>
                                  <body>
                                    <h1>${doc.title}</h1>
                                    <p><em>${doc.description || ''}</em></p>
                                    <hr/>
                                    <pre>${content}</pre>
                                  </body>
                                </html>
                              `);
                              newWindow.document.close();
                            }
                          } else if (doc.file_url) {
                            window.open(doc.file_url, '_blank');
                          } else {
                            toast.info('Nội dung chưa được trích xuất');
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-pale text-primary hover:bg-primary hover:text-white transition-colors text-sm"
                        title="Xem đầy đủ"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Xem</span>
                      </button>

                      {/* Download Button */}
                      <button
                        onClick={() => {
                          const content = doc.extracted_content;
                          if (content) {
                            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${doc.title.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/g, '_')}.txt`;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                            toast.success('Đã tải xuống!');
                          } else if (doc.file_url) {
                            window.open(doc.file_url, '_blank');
                          } else {
                            toast.error('Không có nội dung để tải');
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors text-sm"
                        title="Tải về"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Tải về</span>
                      </button>

                      {/* Sync Button for Google Docs */}
                      {isGoogleUrl && (
                        <button
                          onClick={() => handleSyncDocument(doc)}
                          disabled={syncingDocId === doc.id}
                          className={`p-2 rounded-lg transition-colors ${
                            syncingDocId === doc.id 
                              ? "text-primary bg-primary/10 cursor-not-allowed" 
                              : "text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white"
                          }`}
                          title="Đồng bộ lại từ Google"
                        >
                          <RefreshCw className={`w-4 h-4 ${syncingDocId === doc.id ? 'animate-spin' : ''}`} />
                        </button>
                      )}

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(doc)}
                        className="p-2 rounded-lg text-red-500 bg-red-50 hover:bg-red-500 hover:text-white transition-colors"
                        title="Xóa tài liệu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            
            {documents.filter(doc => doc.title.startsWith('[PPLP]') || doc.folder_id === folders.find(f => f.name === PPLP_FOLDER_NAME)?.id).length === 0 && (
              <div className="text-center py-8 text-foreground-muted">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Chưa có tài liệu PPLP nào</p>
                <p className="text-sm">Import từ mẫu bên dưới hoặc từ Google Docs</p>
              </div>
            )}
          </div>

          {/* Template Import Section */}
          {PPLP_KNOWLEDGE_TEMPLATES.filter(t => !importedPPLPDocs.has(t.id)).length > 0 && (
            <div className="border-t border-primary-pale pt-4">
              <h3 className="text-sm font-medium text-foreground-muted mb-3">📝 Mẫu tài liệu có sẵn để import:</h3>
              <div className="space-y-2">
                {PPLP_KNOWLEDGE_TEMPLATES.filter(t => !importedPPLPDocs.has(t.id)).map((template) => {
                  const isImporting = importingPPLP === template.id;

                  return (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-primary-pale/20 border-primary-pale hover:border-primary transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{template.icon}</span>
                        <div>
                          <h3 className="font-medium text-foreground text-sm">{template.title}</h3>
                          <p className="text-xs text-foreground-muted">{template.description}</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleImportPPLPTemplate(template)}
                        disabled={isImporting || importingAllPPLP}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-white text-sm hover:bg-primary-deep disabled:opacity-50 transition-colors"
                      >
                        {isImporting ? (
                          <>
                            <Sparkles className="w-3 h-3 animate-pulse" />
                            <span>Importing...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3 h-3" />
                            <span>Import</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-soft border border-primary-pale/50 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-xl font-semibold text-primary-deep">
              Tìm Kiếm & Lọc
            </h2>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto flex items-center gap-1 px-3 py-1 text-sm rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Xóa bộ lọc
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-foreground-muted mb-1">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tiêu đề, mô tả..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-pale bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Folder Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground-muted mb-1">
                Thư mục
              </label>
              <select
                value={filterFolder || "all"}
                onChange={(e) => setFilterFolder(e.target.value === "all" ? "all" : e.target.value === "uncategorized" ? "uncategorized" : e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-primary-pale bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              >
                <option value="all">Tất cả thư mục</option>
                <option value="uncategorized">Chưa phân loại</option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>{folder.name}</option>
                ))}
              </select>
            </div>

            {/* Processed Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground-muted mb-1">
                Trạng thái
              </label>
              <select
                value={filterProcessed}
                onChange={(e) => setFilterProcessed(e.target.value as ProcessedFilter)}
                className="w-full px-4 py-2.5 rounded-xl border border-primary-pale bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="processed">✓ Đã xử lý</option>
                <option value="pending">⏳ Chờ xử lý</option>
              </select>
            </div>
          </div>

          {/* Filter Results Summary */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-primary-pale/50">
              <p className="text-sm text-foreground-muted">
                Tìm thấy <span className="font-semibold text-primary">{filteredDocuments.length}</span> tài liệu
                {searchQuery && <span> khớp với "<span className="font-medium">{searchQuery}</span>"</span>}
                {filterFolder !== "all" && (
                  <span> trong thư mục "<span className="font-medium">
                    {filterFolder === "uncategorized" ? "Chưa phân loại" : folders.find(f => f.id === filterFolder)?.name}
                  </span>"</span>
                )}
                {filterProcessed !== "all" && (
                  <span> với trạng thái "<span className="font-medium">
                    {filterProcessed === "processed" ? "Đã xử lý" : "Chờ xử lý"}
                  </span>"</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Documents by Folder */}
        <div className="bg-white rounded-2xl shadow-soft border border-primary-pale/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-semibold text-primary-deep flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Tài Liệu ({hasActiveFilters ? `${filteredDocuments.length}/${documents.length}` : documents.length})
            </h2>
            {documents.length > 0 && !hasActiveFilters && (
              <p className="text-xs text-foreground-muted flex items-center gap-1">
                <GripVertical className="w-3 h-3" />
                Kéo thả để di chuyển tài liệu
              </p>
            )}
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-primary-soft mx-auto mb-4" />
              <p className="text-foreground-muted">Chưa có tài liệu nào được upload</p>
              <p className="text-sm text-foreground-muted/60 mt-1">
                Upload tài liệu đầu tiên để huấn luyện Angel AI
              </p>
            </div>
          ) : hasActiveFilters ? (
            // Show flat list when filtering
            <div className="space-y-2">
              {filteredDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-primary-soft mx-auto mb-4" />
                  <p className="text-foreground-muted">Không tìm thấy tài liệu phù hợp</p>
                  <button
                    onClick={clearFilters}
                    className="mt-3 text-sm text-primary hover:text-primary-deep underline"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              ) : (
                filteredDocuments.map((doc) => (
                  <DocumentItem 
                    key={doc.id} 
                    doc={doc} 
                    onDelete={handleDelete}
                    onSync={handleSyncDocument}
                    onMoveToFolder={handleMoveToFolder}
                    isSyncing={syncingDocId === doc.id}
                    formatFileSize={formatFileSize}
                    getFileIcon={getFileIcon}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedDoc?.id === doc.id}
                    showFolder
                    folderName={doc.folder_id ? folders.find(f => f.id === doc.folder_id)?.name : "Chưa phân loại"}
                    folders={folders}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Documents in Folders */}
              {folders.map((folder) => {
                const folderDocs = getDocumentsInFolder(folder.id);
                const isExpanded = expandedFolders.has(folder.id);
                const isDragOver = dragOverFolderId === folder.id;
                
                return (
                  <div 
                    key={folder.id} 
                    className={`border rounded-xl overflow-hidden transition-all ${
                      isDragOver 
                        ? "border-primary border-2 bg-primary/5" 
                        : "border-primary-pale/50"
                    }`}
                    onDragOver={(e) => handleDragOver(e, folder.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, folder.id)}
                  >
                    <button
                      onClick={() => toggleFolder(folder.id)}
                      className={`w-full flex items-center gap-3 p-4 transition-colors text-left ${
                        isDragOver 
                          ? "bg-primary/10" 
                          : "bg-primary-pale/20 hover:bg-primary-pale/40"
                      }`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-primary" />
                      )}
                      <Folder className={`w-5 h-5 ${isDragOver ? "text-primary animate-bounce" : "text-primary"}`} />
                      <span className="font-medium text-foreground">{folder.name}</span>
                      <span className="text-sm text-foreground-muted">({folderDocs.length} tài liệu)</span>
                      {isDragOver && (
                        <span className="ml-auto text-xs text-primary font-medium">
                          Thả vào đây
                        </span>
                      )}
                    </button>
                    
                    {isExpanded && (
                      <div className="p-3 space-y-2 min-h-[60px]">
                        {folderDocs.length === 0 ? (
                          <p className="text-sm text-foreground-muted text-center py-4">
                            {isDragOver ? "Thả tài liệu vào đây" : "Thư mục trống - kéo tài liệu vào đây"}
                          </p>
                        ) : (
                          folderDocs.map((doc) => (
                            <DocumentItem 
                              key={doc.id} 
                              doc={doc} 
                              onDelete={handleDelete}
                              onSync={handleSyncDocument}
                              onMoveToFolder={handleMoveToFolder}
                              isSyncing={syncingDocId === doc.id}
                              formatFileSize={formatFileSize}
                              getFileIcon={getFileIcon}
                              onDragStart={handleDragStart}
                              onDragEnd={handleDragEnd}
                              isDragging={draggedDoc?.id === doc.id}
                              folders={folders}
                            />
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Uncategorized Documents */}
              <div 
                className={`border rounded-xl overflow-hidden transition-all ${
                  dragOverFolderId === "uncategorized" 
                    ? "border-amber-500 border-2 bg-amber-50" 
                    : "border-primary-pale/50"
                }`}
                onDragOver={(e) => handleDragOver(e, null)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, null)}
              >
                <div className={`flex items-center gap-3 p-4 ${
                  dragOverFolderId === "uncategorized" ? "bg-amber-100" : "bg-gray-100"
                }`}>
                  <Folder className={`w-5 h-5 ${
                    dragOverFolderId === "uncategorized" ? "text-amber-600 animate-bounce" : "text-foreground-muted"
                  }`} />
                  <span className="font-medium text-foreground-muted">Chưa phân loại</span>
                  <span className="text-sm text-foreground-muted">({uncategorizedDocs.length} tài liệu)</span>
                  {dragOverFolderId === "uncategorized" && (
                    <span className="ml-auto text-xs text-amber-600 font-medium">
                      Thả vào đây
                    </span>
                  )}
                </div>
                <div className="p-3 space-y-2 min-h-[60px]">
                  {uncategorizedDocs.length === 0 ? (
                    <p className="text-sm text-foreground-muted text-center py-4">
                      {dragOverFolderId === "uncategorized" ? "Thả tài liệu vào đây" : "Không có tài liệu chưa phân loại"}
                    </p>
                  ) : (
                    uncategorizedDocs.map((doc) => (
                      <DocumentItem 
                        key={doc.id} 
                        doc={doc} 
                        onDelete={handleDelete}
                        onSync={handleSyncDocument}
                        onMoveToFolder={handleMoveToFolder}
                        isSyncing={syncingDocId === doc.id}
                        formatFileSize={formatFileSize}
                        getFileIcon={getFileIcon}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        isDragging={draggedDoc?.id === doc.id}
                        folders={folders}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 p-6 bg-primary-pale/30 rounded-2xl border border-primary-pale/50">
          <h3 className="font-serif text-lg font-semibold text-primary-deep mb-3">
            💫 Hướng dẫn sử dụng
          </h3>
          <ul className="space-y-2 text-sm text-foreground-muted">
            <li>• <strong>Tạo thư mục:</strong> Tổ chức tài liệu theo chủ đề như "Giáo lý", "Thiền định", "Tình yêu"...</li>
            <li>• <strong>Kéo thả:</strong> Giữ và kéo tài liệu để di chuyển giữa các thư mục</li>
            <li>• <strong>Di chuyển nhanh:</strong> Nhấn nút <FolderInput className="w-4 h-4 inline mx-1" /> để chọn thư mục đích cho tài liệu</li>
            <li>• <strong>File TXT/MD/CSV/Excel:</strong> Nội dung sẽ được trích xuất tự động và Angel AI có thể sử dụng ngay</li>
            <li>• <strong>Google Docs/Sheets:</strong> Paste URL và nhấn "Lấy & Xem Trước" để import nội dung (file phải được chia sẻ công khai)</li>
            <li>• <strong className="text-blue-600">🔄 Đồng bộ lại:</strong> Với tài liệu Google, nhấn nút <RefreshCw className="w-3 h-3 inline mx-1" /> để cập nhật nội dung mới nhất từ bản gốc</li>
            <li>• <strong>File PDF/DOCX:</strong> Cần được xử lý thêm để trích xuất nội dung</li>
            <li>• <strong>Không giới hạn dung lượng:</strong> Upload bất kỳ file nào bạn muốn</li>
            <li>• Nội dung trong các tài liệu sẽ được Angel AI sử dụng như nguồn kiến thức bổ sung</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

// Document Item Component with Drag support
const DocumentItem = ({ 
  doc, 
  onDelete, 
  onSync,
  onMoveToFolder,
  isSyncing,
  formatFileSize, 
  getFileIcon,
  onDragStart,
  onDragEnd,
  isDragging,
  showFolder = false,
  folderName,
  folders = []
}: { 
  doc: KnowledgeDocument; 
  onDelete: (doc: KnowledgeDocument) => void;
  onSync?: (doc: KnowledgeDocument) => void;
  onMoveToFolder?: (doc: KnowledgeDocument, folderId: string | null) => void;
  isSyncing?: boolean;
  formatFileSize: (bytes: number) => string;
  getFileIcon: (type: string, fileName: string) => string;
  onDragStart: (e: DragEvent<HTMLDivElement>, doc: KnowledgeDocument) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  showFolder?: boolean;
  folderName?: string;
  folders?: KnowledgeFolder[];
}) => {
  // Check if this is a Google URL that can be synced
  const isGoogleUrl = doc.file_url?.includes('docs.google.com/document') || 
                      doc.file_url?.includes('docs.google.com/spreadsheets');

  return (
    <div 
      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
        isDragging 
          ? "bg-primary/10 border-primary opacity-50 scale-95" 
          : "bg-primary-pale/10 border-primary-pale/20 hover:border-primary/30"
      }`}
      draggable
      onDragStart={(e) => onDragStart(e, doc)}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-center gap-3 min-w-0">
        <GripVertical className="w-4 h-4 text-foreground-muted/50 flex-shrink-0" />
        <span className="text-xl flex-shrink-0">{getFileIcon(doc.file_type, doc.file_name)}</span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground truncate">{doc.title}</h3>
            {isGoogleUrl && (
              <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                Google
              </span>
            )}
          </div>
          {doc.description && (
            <p className="text-sm text-foreground-muted truncate">{doc.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1 text-xs text-foreground-muted/70 flex-wrap">
            {showFolder && folderName && (
              <>
                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-primary-pale rounded text-primary">
                  <Folder className="w-3 h-3" />
                  {folderName}
                </span>
                <span>•</span>
              </>
            )}
            <span>{formatFileSize(doc.file_size)}</span>
            <span>•</span>
            <span>{new Date(doc.created_at).toLocaleDateString("vi-VN")}</span>
            <span>•</span>
            {doc.is_processed ? (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-3 h-3" /> Đã xử lý
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600">
                <Clock className="w-3 h-3" /> Chờ xử lý
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Move to folder dropdown */}
        {onMoveToFolder && folders.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-full text-primary hover:bg-primary-pale transition-colors"
                title="Di chuyển đến thư mục"
              >
                <FolderInput className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-0 max-h-80 overflow-y-auto">
              <div className="px-2 py-1.5 text-xs font-semibold text-foreground-muted border-b sticky top-0 bg-popover z-10">
                Di chuyển đến thư mục
              </div>
              <div className="p-1">
                {folders.map((folder) => (
                  <DropdownMenuItem 
                    key={folder.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (doc.folder_id !== folder.id) {
                        onMoveToFolder(doc, folder.id);
                      }
                    }}
                    className={doc.folder_id === folder.id ? "bg-primary-pale/50" : ""}
                  >
                    <Folder className="w-4 h-4 mr-2 text-primary" />
                    {folder.name}
                    {doc.folder_id === folder.id && (
                      <CheckCircle className="w-3 h-3 ml-auto text-green-600" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (doc.folder_id !== null) {
                      onMoveToFolder(doc, null);
                    }
                  }}
                  className={doc.folder_id === null ? "bg-primary-pale/50" : ""}
                >
                  <Folder className="w-4 h-4 mr-2 text-foreground-muted" />
                  Chưa phân loại
                  {doc.folder_id === null && (
                    <CheckCircle className="w-3 h-3 ml-auto text-green-600" />
                  )}
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {isGoogleUrl && onSync && (
          <button
            onClick={(e) => { e.stopPropagation(); onSync(doc); }}
            disabled={isSyncing}
            className={`p-2 rounded-full transition-colors ${
              isSyncing 
                ? "text-primary bg-primary/10 cursor-not-allowed" 
                : "text-blue-600 hover:bg-blue-50"
            }`}
            title="Đồng bộ lại từ Google"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(doc); }}
          className="p-2 rounded-full text-red-500 hover:bg-red-50 transition-colors"
          title="Xóa tài liệu"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AdminKnowledge;