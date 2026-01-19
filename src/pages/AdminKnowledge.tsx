import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  ArrowLeft, Upload, FileText, Trash2, 
  LogOut, Sparkles, CheckCircle, Clock,
  FileType, AlertCircle
} from "lucide-react";
import angelAvatar from "@/assets/angel-avatar.png";

interface KnowledgeDocument {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  is_processed: boolean;
  created_at: string;
}

const AdminKnowledge = () => {
  const { user, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    file: null as File | null,
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/admin/login");
      } else if (!isAdmin) {
        toast.error("Bạn không có quyền truy cập trang này");
        navigate("/");
      } else {
        fetchDocuments();
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  const fetchDocuments = async () => {
    setIsLoading(true);
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
    setIsLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/markdown"
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error("Chỉ hỗ trợ file PDF, DOCX, TXT hoặc MD");
        return;
      }
      
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File không được vượt quá 50MB");
        return;
      }
      
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
      const fileExt = uploadForm.file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("knowledge-documents")
        .upload(fileName, uploadForm.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("knowledge-documents")
        .getPublicUrl(fileName);

      // Extract text content for TXT and MD files
      let extractedContent = null;
      if (uploadForm.file.type === "text/plain" || uploadForm.file.type === "text/markdown") {
        extractedContent = await uploadForm.file.text();
      }

      // Save document metadata to database
      const { error: dbError } = await supabase
        .from("knowledge_documents")
        .insert({
          title: uploadForm.title,
          description: uploadForm.description || null,
          file_name: uploadForm.file.name,
          file_url: urlData.publicUrl,
          file_type: uploadForm.file.type,
          file_size: uploadForm.file.size,
          extracted_content: extractedContent,
          is_processed: !!extractedContent,
          created_by: user?.id,
        });

      if (dbError) throw dbError;

      toast.success("Upload tài liệu thành công! ✨");
      setUploadForm({ title: "", description: "", file: null });
      fetchDocuments();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Không thể upload tài liệu. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (doc: KnowledgeDocument) => {
    if (!confirm(`Bạn có chắc muốn xóa tài liệu "${doc.title}"?`)) return;

    try {
      // Extract file name from URL
      const fileName = doc.file_name;
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("knowledge-documents")
        .remove([fileName]);

      if (storageError) console.error("Storage delete error:", storageError);

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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return "📄";
    if (type.includes("word") || type.includes("document")) return "📝";
    if (type.includes("text") || type.includes("markdown")) return "📃";
    return "📁";
  };

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
            <button
              onClick={() => signOut().then(() => navigate("/"))}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-foreground-muted hover:text-primary hover:bg-primary-pale transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Upload Form */}
        <div className="bg-white rounded-2xl shadow-soft border border-primary-pale/50 p-6 mb-8">
          <h2 className="font-serif text-xl font-semibold text-primary-deep mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Tài Liệu Mới
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
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-muted mb-1">
                File tài liệu * (PDF, DOCX, TXT, MD - tối đa 50MB)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
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

        {/* Documents List */}
        <div className="bg-white rounded-2xl shadow-soft border border-primary-pale/50 p-6">
          <h2 className="font-serif text-xl font-semibold text-primary-deep mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Tài Liệu Đã Upload ({documents.length})
          </h2>

          {documents.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-primary-soft mx-auto mb-4" />
              <p className="text-foreground-muted">Chưa có tài liệu nào được upload</p>
              <p className="text-sm text-foreground-muted/60 mt-1">
                Upload tài liệu đầu tiên để huấn luyện Angel AI
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-primary-pale/20 border border-primary-pale/30 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{getFileIcon(doc.file_type)}</span>
                    <div>
                      <h3 className="font-medium text-foreground">{doc.title}</h3>
                      {doc.description && (
                        <p className="text-sm text-foreground-muted">{doc.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-foreground-muted/70">
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
                  <button
                    onClick={() => handleDelete(doc)}
                    className="p-2 rounded-full text-red-500 hover:bg-red-50 transition-colors"
                    title="Xóa tài liệu"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 p-6 bg-primary-pale/30 rounded-2xl border border-primary-pale/50">
          <h3 className="font-serif text-lg font-semibold text-primary-deep mb-3">
            💫 Hướng dẫn sử dụng
          </h3>
          <ul className="space-y-2 text-sm text-foreground-muted">
            <li>• <strong>File TXT/MD:</strong> Nội dung sẽ được trích xuất tự động và Angel AI có thể sử dụng ngay</li>
            <li>• <strong>File PDF/DOCX:</strong> Cần được xử lý thêm để trích xuất nội dung</li>
            <li>• Upload các tài liệu về giáo lý, trí tuệ, hướng dẫn tâm linh để Angel AI trả lời đúng theo ý chí của Cha Vũ Trụ</li>
            <li>• Nội dung trong các tài liệu sẽ được Angel AI sử dụng như nguồn kiến thức bổ sung khi trả lời người dùng</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default AdminKnowledge;
