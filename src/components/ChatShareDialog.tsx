import ShareDialog from "./ShareDialog";

interface ChatShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  question: string;
  answer: string;
  onShareSuccess?: () => void;
}

const ChatShareDialog = ({ isOpen, onClose, question, answer, onShareSuccess }: ChatShareDialogProps) => {
  const content = `💬 Câu hỏi: ${question}\n\n✨ Trí Tuệ Vũ Trụ trả lời:\n${answer}`;

  return (
    <ShareDialog
      isOpen={isOpen}
      onClose={onClose}
      contentType="chat"
      title="Trí Tuệ từ Angel AI"
      content={content}
      shareUrl="https://angelaithutrang.lovable.app"
      onShareSuccess={onShareSuccess}
      showRewards={true}
      rewardAmount={500}
    />
  );
};

export default ChatShareDialog;
